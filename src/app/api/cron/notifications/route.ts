import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendQueuedNotification } from '@/lib/email/send';

export const maxDuration = 120;

/**
 * Notification delivery sweep. Wired in vercel.json:
 *   { "path": "/api/cron/notifications", "schedule": "*\/10 * * * *" }
 *
 * Most notifications are delivered inline at creation time (e.g. submit-form
 * sends the lead alert immediately). This sweep is the retry/backstop path:
 *   - pending rows whose inline send failed (Resend hiccup)
 *   - pending rows created by code paths with no inline send (bookings, etc.)
 *   - rows whose recipient_email was empty at creation — re-resolve the
 *     owner's email from auth.users and deliver
 *
 * Rows older than 7 days are marked 'expired' instead of sent — a week-old
 * "new lead" alert does more harm than good.
 *
 * Auth: requires Bearer ${CRON_SECRET} header, or Vercel's built-in cron auth.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sb = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

  // Expire stale pending notifications first so they never send.
  await sb
    .from('notifications')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('created_at', weekAgo);

  const { data: rows, error } = await sb
    .from('notifications')
    .select('id, project_id, type, recipient_email, subject, body, created_at')
    .eq('status', 'pending')
    .gte('created_at', weekAgo)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';
  const ownerEmailCache = new Map<string, string | null>();
  const results: Array<{ id: string; ok: boolean; reason?: string }> = [];

  for (const row of rows ?? []) {
    try {
      let to = row.recipient_email;

      // Recipient missing (older rows stored the lead's email or nothing) —
      // resolve the project owner's email from auth.users.
      if (!to) {
        const { data: project } = await sb
          .from('projects')
          .select('user_id')
          .eq('id', row.project_id)
          .single();
        if (project?.user_id) {
          if (!ownerEmailCache.has(project.user_id)) {
            const { data: ownerUser } = await sb.auth.admin.getUserById(project.user_id);
            ownerEmailCache.set(project.user_id, ownerUser?.user?.email ?? null);
          }
          to = ownerEmailCache.get(project.user_id) ?? '';
        }
      }

      if (!to) {
        await sb.from('notifications').update({ status: 'failed' }).eq('id', row.id);
        results.push({ id: row.id, ok: false, reason: 'no_recipient' });
        continue;
      }

      const result = await sendQueuedNotification({
        to,
        subject: row.subject,
        body: row.body || '',
        leadsUrl: `${appUrl}/projects/${row.project_id}/leads`,
      });

      if (result.ok) {
        await sb
          .from('notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString(), recipient_email: to })
          .eq('id', row.id);
        results.push({ id: row.id, ok: true });
      } else if (result.code === 'not_configured') {
        // Leave pending — nothing will succeed this run.
        results.push({ id: row.id, ok: false, reason: 'email_not_configured' });
        break;
      } else {
        // Leave pending for the next sweep (transient send failure).
        results.push({ id: row.id, ok: false, reason: result.error });
      }
    } catch (err) {
      results.push({ id: row.id, ok: false, reason: err instanceof Error ? err.message : 'unknown' });
    }
  }

  // ── Unanswered-lead nudges ─────────────────────────────────────────────
  // Leads still 'new' after 4 hours get one reminder to the owner — speed
  // wins deals, and inboxes bury things. One nudge per lead, ever.
  const fourHoursAgo = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data: staleLeads } = await sb
    .from('form_submissions')
    .select('id, project_id, name, email, phone, message, form_type, form_data, created_at')
    .eq('status', 'new')
    .lt('created_at', fourHoursAgo)
    .gte('created_at', twoDaysAgo)
    .order('created_at', { ascending: true })
    .limit(20);

  let nudged = 0;
  for (const lead of staleLeads ?? []) {
    const formData = (lead.form_data || {}) as Record<string, unknown>;
    if (formData.nudge_sent) continue;
    try {
      const { data: project } = await sb
        .from('projects')
        .select('user_id, name')
        .eq('id', lead.project_id)
        .single();
      if (!project?.user_id) continue;
      if (!ownerEmailCache.has(project.user_id)) {
        const { data: ownerUser } = await sb.auth.admin.getUserById(project.user_id);
        ownerEmailCache.set(project.user_id, ownerUser?.user?.email ?? null);
      }
      const ownerEmail = ownerEmailCache.get(project.user_id);
      if (!ownerEmail) continue;

      const who = lead.name || lead.email || lead.phone || 'A lead';
      const hoursAgo = Math.round((Date.now() - new Date(lead.created_at).getTime()) / 3600000);
      const draft = formData.ai_draft as string | undefined;
      const replyToken = formData.reply_token as string | undefined;
      const replyLine = draft && replyToken
        ? `\n\nYour drafted reply is ready — send it with one click:\n${appUrl}/api/leads/reply?sid=${lead.id}&token=${replyToken}\n\n--- Draft ---\n${draft}\n---`
        : '';

      const result = await sendQueuedNotification({
        to: ownerEmail,
        subject: `${who} is still waiting (${hoursAgo}h) — ${project.name}`,
        body:
          `This ${lead.form_type || 'lead'} came in ${hoursAgo} hours ago and hasn't been answered yet. ` +
          `Leads contacted fast are far more likely to close.\n\n` +
          [lead.name && `Name: ${lead.name}`, lead.email && `Email: ${lead.email}`, lead.phone && `Phone: ${lead.phone}`, lead.message && `Message: ${lead.message}`]
            .filter(Boolean).join('\n') +
          replyLine,
        leadsUrl: `${appUrl}/projects/${lead.project_id}/leads`,
      });

      // Mark nudged even on send failure — one attempt, no nag loops.
      await sb
        .from('form_submissions')
        .update({ form_data: { ...formData, nudge_sent: true } })
        .eq('id', lead.id);
      if (result.ok) nudged++;
    } catch (err) {
      console.error('[Nudge] Failed for lead', lead.id, err);
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({ processed: results.length, sent, nudged, results });
}

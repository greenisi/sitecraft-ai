import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendQueuedNotification } from '@/lib/email/send';

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

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({ processed: results.length, sent, results });
}

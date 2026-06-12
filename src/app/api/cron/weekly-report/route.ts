import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWeeklyReport } from '@/lib/email/send';
import { writeWeeklyNarrative } from '@/lib/ai/weekly-report';

export const maxDuration = 300;

/**
 * Monday morning report. Wired in vercel.json:
 *   { "path": "/api/cron/weekly-report", "schedule": "0 13 * * 1" }  // 8am ET
 *
 * One email per owner with at least one published project, aggregating the
 * last 7 days across all their projects: leads, bookings, orders, top pages.
 * A short Claude (Haiku) narrative turns the numbers into "your website
 * worked for you this week" — the retention artifact for the paid tiers.
 *
 * Auth: requires Bearer ${CRON_SECRET} header, or Vercel's built-in cron auth.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sb = createAdminClient();
  const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const sinceDateOnly = since.slice(0, 10);

  const { data: projects, error } = await sb
    .from('projects')
    .select('id, user_id, name, published_url')
    .eq('status', 'published');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group published projects by owner.
  const byOwner = new Map<string, Array<{ id: string; name: string; published_url: string | null }>>();
  for (const p of projects ?? []) {
    const list = byOwner.get(p.user_id) || [];
    list.push({ id: p.id, name: p.name, published_url: p.published_url });
    byOwner.set(p.user_id, list);
  }

  const results: Array<{ user: string; ok: boolean; reason?: string }> = [];

  for (const [userId, ownerProjects] of byOwner) {
    try {
      const projectIds = ownerProjects.map((p) => p.id);

      const [{ data: submissions }, { data: bookings }, { data: orders }] = await Promise.all([
        sb.from('form_submissions')
          .select('project_id, form_type, source_page, created_at')
          .in('project_id', projectIds)
          .gte('created_at', since),
        sb.from('bookings')
          .select('project_id, status, created_at')
          .in('project_id', projectIds)
          .gte('created_at', since),
        sb.from('orders')
          .select('project_id, total, status, created_at')
          .in('project_id', projectIds)
          .gte('created_at', since),
      ]);

      const stats = {
        weekOf: sinceDateOnly,
        projects: ownerProjects.map((p) => {
          const subs = (submissions || []).filter((s) => s.project_id === p.id);
          const books = (bookings || []).filter((b) => b.project_id === p.id);
          const ords = (orders || []).filter((o) => o.project_id === p.id);
          const pageCounts = new Map<string, number>();
          for (const s of subs) {
            if (s.source_page) pageCounts.set(s.source_page, (pageCounts.get(s.source_page) || 0) + 1);
          }
          const topPages = [...pageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
          return {
            name: p.name,
            url: p.published_url,
            leads: subs.length,
            bookings: books.length,
            bookingsConfirmed: books.filter((b) => b.status === 'confirmed').length,
            orders: ords.length,
            revenue: ords.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
            topPages,
          };
        }),
      };

      const totals = {
        leads: stats.projects.reduce((s, p) => s + p.leads, 0),
        bookings: stats.projects.reduce((s, p) => s + p.bookings, 0),
        orders: stats.projects.reduce((s, p) => s + p.orders, 0),
        revenue: stats.projects.reduce((s, p) => s + p.revenue, 0),
      };

      const { data: ownerUser } = await sb.auth.admin.getUserById(userId);
      const ownerEmail = ownerUser?.user?.email;
      if (!ownerEmail) {
        results.push({ user: userId, ok: false, reason: 'no_email' });
        continue;
      }

      // Short Claude narrative; falls back to a plain opener on failure.
      const narrative = await writeWeeklyNarrative({ totals, projects: stats.projects });

      const sendResult = await sendWeeklyReport({
        to: ownerEmail,
        narrative,
        totals,
        projects: stats.projects,
      });
      results.push({ user: userId, ok: sendResult.ok, reason: sendResult.ok ? undefined : sendResult.error });
    } catch (err) {
      results.push({ user: userId, ok: false, reason: err instanceof Error ? err.message : 'unknown' });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({ owners: results.length, sent, results });
}

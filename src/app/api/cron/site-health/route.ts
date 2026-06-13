import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publishToSubdomain } from '@/lib/export/platform-publisher';

export const maxDuration = 300;

/**
 * Self-heal: every published site gets a pulse check. Wired in vercel.json:
 *   { "path": "/api/cron/site-health", "schedule": "0 *\/6 * * *" }  // every 6h
 *
 * For each published project:
 *   - GET the published URL (10s timeout, one retry after 5s)
 *   - Healthy → record health_status 'ok', reset heal_attempts
 *   - Down/5xx → if heal_attempts < 2, REPUBLISH the site from its stored
 *     files (the publisher's validation/repair pipeline runs again) and queue
 *     an owner notification describing what happened
 *   - heal_attempts >= 2 → mark 'failed', notify owner that manual attention
 *     is needed (no infinite republish loops on genuinely broken sites)
 *
 * Republishes are capped at 3 per run — they're heavyweight Vercel builds.
 *
 * Auth: requires Bearer ${CRON_SECRET} header, or Vercel's built-in cron auth.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sb = createAdminClient();
  // Optional ?project=<id> scopes the run to one project (debugging/manual checks).
  const scopeProject = new URL(request.url).searchParams.get('project');
  let query = sb
    .from('projects')
    .select('id, user_id, name, published_url, heal_attempts')
    .eq('status', 'published')
    .not('published_url', 'is', null);
  if (scopeProject) query = query.eq('id', scopeProject);
  const { data: projects, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const MAX_HEALS_PER_RUN = 3;
  let healsThisRun = 0;
  const results: Array<{ project: string; health: string; healed?: boolean }> = [];

  for (const project of projects ?? []) {
    const now = new Date().toISOString();
    try {
      const healthy = await isSiteUp(project.published_url) || await retryAfter(5000, project.published_url);

      if (healthy) {
        await sb.from('projects')
          .update({ health_status: 'ok', last_health_check: now, heal_attempts: 0 })
          .eq('id', project.id);
        results.push({ project: project.name, health: 'ok' });
        continue;
      }

      const attempts = project.heal_attempts ?? 0;

      if (attempts >= 2 || healsThisRun >= MAX_HEALS_PER_RUN) {
        await sb.from('projects')
          .update({ health_status: 'failed', last_health_check: now })
          .eq('id', project.id);
        if (attempts === 2) {
          // Notify exactly once when we give up.
          await queueOwnerNote(sb, project, 'site_down',
            `Your site is down — we need to take a look`,
            `${project.published_url} isn't responding and automatic repair didn't fix it. We've been alerted and are on it; reply to this email if you have questions.`);
        }
        results.push({ project: project.name, health: 'failed' });
        continue;
      }

      // Attempt the heal: republish runs the full validation/repair pipeline
      // over the stored site files and redeploys.
      healsThisRun++;
      await sb.from('projects')
        .update({ health_status: 'healing', last_health_check: now, heal_attempts: attempts + 1 })
        .eq('id', project.id);

      const publishResult = await publishToSubdomain(project.id, project.user_id);
      const healed = publishResult.status === 'published' || publishResult.status === 'deploying';

      await sb.from('projects')
        .update({ health_status: healed ? 'ok' : 'failed', last_health_check: new Date().toISOString() })
        .eq('id', project.id);

      if (healed) {
        await queueOwnerNote(sb, project, 'site_healed',
          `We detected a problem with your site and fixed it`,
          `${project.published_url} stopped responding, so your website rebuilt and redeployed itself automatically. It's back online — no action needed. (This is your site's self-healing system at work.)`);
      }
      results.push({ project: project.name, health: healed ? 'healed' : 'heal_failed', healed });
    } catch (err) {
      console.error('[Site Health] Error for project', project.id, err);
      await sb.from('projects')
        .update({ health_status: 'check_error', last_health_check: now })
        .eq('id', project.id);
      results.push({ project: project.name, health: 'check_error' });
    }
  }

  const summary = {
    checked: results.length,
    ok: results.filter((r) => r.health === 'ok').length,
    healed: results.filter((r) => r.health === 'healed').length,
    failed: results.filter((r) => r.health === 'failed' || r.health === 'heal_failed').length,
  };
  return NextResponse.json({ ...summary, results });
}

async function isSiteUp(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SiteCraft-HealthCheck/1.0' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    return res.status < 500;
  } catch {
    return false;
  }
}

async function retryAfter(ms: number, url: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, ms));
  return isSiteUp(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queueOwnerNote(sb: any, project: { id: string; user_id: string }, type: string, subject: string, body: string) {
  try {
    const { data: ownerUser } = await sb.auth.admin.getUserById(project.user_id);
    await sb.from('notifications').insert({
      project_id: project.id,
      type,
      recipient_email: ownerUser?.user?.email || '',
      subject,
      body,
      status: 'pending',
    });
  } catch (err) {
    console.error('[Site Health] Failed to queue owner note:', err);
  }
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlaceDetails } from '@/lib/googlePlaces';
import { syncGoogleReviewsForProject } from '@/lib/googleReviewsSync';

/**
 * Weekly refresh of imported Google reviews.
 * Wired in vercel.json:
 *   { "path": "/api/cron/refresh-reviews", "schedule": "0 8 * * 1" }   // Mondays 08:00 UTC
 *
 * Strategy: pick up to 50 connections last synced more than 6 days ago, refresh each.
 * On failure we record last_sync_error and move on; we don't retry inside the cron.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ skipped: 'no key' }, { status: 200 });
  }

  const sb = createAdminClient();
  const cutoff = new Date(Date.now() - 6 * 86400 * 1000).toISOString();

  const { data: rows } = await sb
    .from('google_places_connections')
    .select('project_id, place_id')
    .lt('last_synced_at', cutoff)
    .order('last_synced_at', { ascending: true })
    .limit(50);

  const results: Array<{ projectId: string; ok: boolean; reason?: string }> = [];

  for (const row of rows ?? []) {
    try {
      const details = await getPlaceDetails(row.place_id);
      await syncGoogleReviewsForProject(sb, row.project_id, details);
      results.push({ projectId: row.project_id, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      await sb
        .from('google_places_connections')
        .update({ last_sync_error: msg })
        .eq('project_id', row.project_id);
      results.push({ projectId: row.project_id, ok: false, reason: msg });
    }
  }

  return NextResponse.json({ ran: results.length, results });
}

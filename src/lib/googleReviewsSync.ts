/**
 * Shared sync logic — upsert google_places_connections row + upsert review rows.
 * Used by /connect, /refresh, and the cron job.
 *
 * Compliance note (Google ToS):
 *   - We store reviews unmodified.
 *   - We keep author_name, profile_photo_url, and the original posted time.
 *   - We surface html_attributions on the connection so the storefront can render them.
 *   - We refresh weekly; we never serve cached data older than 30 days without re-fetching.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlaceDetails } from '@/lib/googlePlaces';

export interface SyncResult {
  ok: true;
  connection: {
    place_id: string;
    business_name: string;
    formatted_address: string;
    rating?: number;
    user_ratings_total?: number;
    last_synced_at: string;
  };
  reviewsImported: number;
}

export async function syncGoogleReviewsForProject(
  supabase: SupabaseClient,
  projectId: string,
  details: PlaceDetails
): Promise<SyncResult> {
  const now = new Date().toISOString();

  // 1. Upsert connection
  const { data: conn, error: connErr } = await supabase
    .from('google_places_connections')
    .upsert(
      {
        project_id: projectId,
        place_id: details.place_id,
        business_name: details.name,
        formatted_address: details.formatted_address,
        rating: details.rating ?? null,
        user_ratings_total: details.user_ratings_total ?? null,
        attribution_html: (details.html_attributions ?? []).join('\n') || null,
        google_url: details.url ?? null,
        last_synced_at: now,
        last_sync_error: null,
      },
      { onConflict: 'project_id' }
    )
    .select()
    .single();

  if (connErr) throw new Error(connErr.message);

  // 2. Upsert reviews. Use Google's review.time (unix seconds) as the external_id.
  const reviews = details.reviews ?? [];
  if (reviews.length > 0) {
    const rows = reviews.map((r) => ({
      project_id: projectId,
      source: 'google',
      external_id: String(r.time),
      external_url: details.url ?? null,
      customer_name: r.author_name,
      author_photo_url: r.profile_photo_url ?? null,
      rating: Math.max(1, Math.min(5, Math.round(r.rating))),
      review_text: r.text ?? '',
      posted_at: new Date(r.time * 1000).toISOString(),
      is_approved: true, // imported Google reviews are pre-approved
      is_featured: false,
    }));

    const { error: revErr } = await supabase
      .from('reviews')
      .upsert(rows, { onConflict: 'project_id,source,external_id' });

    if (revErr) throw new Error(revErr.message);
  }

  return {
    ok: true,
    connection: {
      place_id: conn.place_id,
      business_name: conn.business_name,
      formatted_address: conn.formatted_address,
      rating: conn.rating ?? undefined,
      user_ratings_total: conn.user_ratings_total ?? undefined,
      last_synced_at: conn.last_synced_at,
    },
    reviewsImported: reviews.length,
  };
}

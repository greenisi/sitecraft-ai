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

/**
 * Ratings at or above this import already approved. Below it, the review is
 * still imported and still visible to the owner -- it just does not publish
 * itself onto their marketing site without them saying so.
 */
const AUTO_APPROVE_RATING = 4;

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
  /** Imported and live on the site straight away. */
  reviewsApproved: number;
  /** Imported but held for the owner to review. */
  reviewsHeld: number;
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
    // The weekly refresh upserts these same rows. Without knowing what the
    // owner already decided, it would overwrite is_approved every Monday and
    // silently un-publish a low review they had deliberately promoted, or
    // re-publish one they had hidden. Their decision wins over the default.
    const { data: existingRows } = await supabase
      .from('reviews')
      .select('external_id, is_approved')
      .eq('project_id', projectId)
      .eq('source', 'google');

    const decidedByOwner = new Map<string, boolean>(
      (existingRows ?? []).map((row: { external_id: string; is_approved: boolean }) => [
        row.external_id,
        row.is_approved,
      ])
    );

    const rows = reviews.map((r) => {
      const rating = Math.max(1, Math.min(5, Math.round(r.rating)));
      return {
        project_id: projectId,
        source: 'google',
        external_id: String(r.time),
        external_url: details.url ?? null,
        customer_name: r.author_name,
        author_photo_url: r.profile_photo_url ?? null,
        rating,
        review_text: r.text ?? '',
        posted_at: new Date(r.time * 1000).toISOString(),
        // Every imported review used to arrive pre-approved, which put a
        // business's one-star reviews straight onto its own homepage. Nothing
        // is deleted -- a low review still imports and is visible in the
        // dashboard, where the owner can publish it deliberately -- but only
        // reviews they would actually choose to show go live on their own.
        is_approved: decidedByOwner.has(String(r.time))
          ? decidedByOwner.get(String(r.time))!
          : rating >= AUTO_APPROVE_RATING,
        is_featured: false,
      };
    });

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
    reviewsApproved: reviews.filter(
      (r) => Math.max(1, Math.min(5, Math.round(r.rating))) >= AUTO_APPROVE_RATING
    ).length,
    reviewsHeld: reviews.filter(
      (r) => Math.max(1, Math.min(5, Math.round(r.rating))) < AUTO_APPROVE_RATING
    ).length,
  };
}

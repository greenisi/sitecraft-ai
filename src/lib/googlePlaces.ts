/**
 * Google Places API (Legacy) client.
 *
 * Why legacy and not the new Places API (New)?
 *   - Legacy returns up to 5 reviews on the Place Details endpoint without extra cost.
 *   - The new Places API requires a separate (more expensive) field group for reviews.
 *   - We can migrate later; the data shape is similar.
 *
 * Server-only. API key never leaves this module.
 */

const KEY = process.env.GOOGLE_PLACES_API_KEY;

export interface PlaceCandidate {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
}

export interface PlaceReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number; // unix seconds
  language?: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: PlaceReview[];
  html_attributions: string[];
  url?: string; // Google Maps URL
}

function assertKey(): string {
  if (!KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY is not set');
  }
  return KEY;
}

/** Extract place_id from a Google Maps URL or short link. Returns null if not extractable. */
export function extractPlaceIdFromUrl(url: string): string | null {
  // Patterns seen in the wild:
  //   https://www.google.com/maps/place/.../data=...!1s0x...!...   (CID embedded)
  //   https://maps.app.goo.gl/abc                                  (short link → needs resolve)
  //   https://www.google.com/maps?cid=12345                        (CID only)
  // We cannot resolve short links here. We hand back null and let the user search instead.
  const placeIdMatch = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
  if (placeIdMatch) return placeIdMatch[1];
  return null;
}

/** Text Search: find candidate places by query string + optional bias. */
export async function searchPlace(query: string, locationBias?: string): Promise<PlaceCandidate[]> {
  const key = assertKey();
  const u = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  u.searchParams.set('query', locationBias ? `${query} ${locationBias}` : query);
  u.searchParams.set('key', key);

  const res = await fetch(u.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Places search failed: ${res.status}`);
  const json = await res.json();
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Places search ${json.status}: ${json.error_message ?? ''}`);
  }
  return (json.results ?? []).slice(0, 8).map((r: Record<string, unknown>) => ({
    place_id: r.place_id as string,
    name: r.name as string,
    formatted_address: r.formatted_address as string,
    rating: r.rating as number | undefined,
    user_ratings_total: r.user_ratings_total as number | undefined,
  }));
}

/** Place Details: full info + up to 5 reviews. */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const key = assertKey();
  const u = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  u.searchParams.set('place_id', placeId);
  u.searchParams.set(
    'fields',
    'place_id,name,formatted_address,rating,user_ratings_total,reviews,url'
  );
  u.searchParams.set('reviews_no_translations', 'true');
  u.searchParams.set('reviews_sort', 'newest');
  u.searchParams.set('key', key);

  const res = await fetch(u.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Place details failed: ${res.status}`);
  const json = await res.json();
  if (json.status !== 'OK') {
    throw new Error(`Place details ${json.status}: ${json.error_message ?? ''}`);
  }
  const r = json.result as Record<string, unknown>;
  return {
    place_id: r.place_id as string,
    name: r.name as string,
    formatted_address: r.formatted_address as string,
    rating: r.rating as number | undefined,
    user_ratings_total: r.user_ratings_total as number | undefined,
    reviews: (r.reviews as PlaceReview[] | undefined) ?? [],
    html_attributions: (json.html_attributions as string[]) ?? [],
    url: r.url as string | undefined,
  };
}

/**
 * Do these two business names plausibly refer to the same business?
 *
 * Deliberately generous. Real listings legitimately differ from what an owner
 * typed -- "Fortress Floors GA" against "Fortress Floors of Georgia LLC" is
 * the same company -- so this only reports what it is confident about, and the
 * caller warns rather than blocks. The case it must catch is the one that
 * actually happened: "Salt & Ember" against "Activate Pressure Washing",
 * which share nothing at all.
 */
const NAME_NOISE = new Set([
  'the', 'and', 'of', 'llc', 'inc', 'ltd', 'co', 'corp', 'company', 'group',
  'services', 'service', 'holdings', 'enterprises', 'usa', 'plc', 'pllc',
]);

function nameTokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 3 && !NAME_NOISE.has(word))
  );
}

export function looksLikeSameBusiness(projectName: string, placeName: string): boolean {
  const a = nameTokens(projectName);
  const b = nameTokens(placeName);
  // Nothing meaningful to compare -- say nothing rather than cry wolf.
  if (a.size === 0 || b.size === 0) return true;

  for (const token of a) {
    if (b.has(token)) return true;
    // Catch "Ridgeline" against "Ridgeline Roofing Co" style prefixes.
    for (const other of b) {
      if (token.length >= 5 && (other.startsWith(token) || token.startsWith(other))) return true;
    }
  }
  return false;
}

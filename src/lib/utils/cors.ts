// CORS helper for endpoints that generated stores (on the merchant's own
// domain) must be able to call back into.
//
// Public + per-project-keyed-by-UUID, so wide-open is safe. If we ever add
// auth-aware endpoints to this list, tighten the allowed origin to the
// merchant's actual published_url.

export const STOREFRONT_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
} as const;

export function corsPreflight() {
  return new Response(null, { status: 204, headers: STOREFRONT_CORS });
}

export function withCors<T>(body: T, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  for (const [k, v] of Object.entries(STOREFRONT_CORS)) headers.set(k, v);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

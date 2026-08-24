'use client';

import { useCallback, useEffect, useState } from 'react';

interface Candidate {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
}

interface PendingPlace {
  place_id: string;
  nameMismatch?: boolean;
  projectBusinessName?: string;
  name: string;
  formatted_address: string;
  rating: number | null;
  user_ratings_total: number | null;
  sample: Array<{ rating: number; author: string; text: string }>;
}

interface Connection {
  place_id: string;
  business_name: string;
  formatted_address: string;
  rating: number | null;
  user_ratings_total: number | null;
  attribution_html: string | null;
  google_url: string | null;
  last_synced_at: string;
  last_sync_error: string | null;
}

export function GoogleReviewsPanel({
  projectId,
  onChanged,
}: {
  projectId: string;
  onChanged?: () => void;
}) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingPlace | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/reviews/google`);
    if (res.ok) {
      const data = await res.json();
      setConnection(data.connection ?? null);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/reviews/google/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, city }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'search failed');
      setCandidates(data.candidates ?? []);
      if ((data.candidates ?? []).length === 0) setMsg('No matches. Try adding the city.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'search failed');
    } finally {
      setSearching(false);
    }
  }

  // Two phases. The first call imports nothing and comes back with what
  // Google matched, so a wrong listing is caught before its reviews land on
  // someone's site rather than after.
  async function connect(place_id: string, confirmed = false) {
    setConnecting(place_id);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/reviews/google/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id, confirmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'connect failed');

      if (data.needsConfirmation) {
        setPending({
          ...(data.place as PendingPlace),
          nameMismatch: data.nameMismatch,
          projectBusinessName: data.projectBusinessName,
        });
        return;
      }

      const held = data.reviewsHeld ?? 0;
      setMsg(
        held > 0
          ? `Imported ${data.reviewsImported}. ${data.reviewsApproved} are live; ${held} under 4 stars are waiting for you below.`
          : `Imported ${data.reviewsImported} reviews.`
      );
      setPending(null);
      setCandidates([]);
      setQuery('');
      await load();
      onChanged?.();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'connect failed');
    } finally {
      setConnecting(null);
    }
  }

  async function refresh() {
    setRefreshing(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/reviews/google/refresh`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'refresh failed');
      setMsg(`Refreshed. Imported ${data.reviewsImported} reviews.`);
      await load();
      onChanged?.();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect Google Reviews? Imported reviews will be removed from this site.')) return;
    const res = await fetch(`/api/projects/${projectId}/reviews/google/connect`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setConnection(null);
      setMsg('Disconnected.');
      onChanged?.();
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-400 text-sm">
        Loading Google connection…
      </div>
    );
  }

  if (connection) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GoogleG />
              <h2 className="text-lg font-semibold text-white">Google Reviews — Connected</h2>
            </div>
            <p className="text-white mt-2 font-medium">{connection.business_name}</p>
            <p className="text-sm text-gray-400">{connection.formatted_address}</p>
            <p className="text-sm text-gray-300 mt-2">
              ⭐ {connection.rating?.toFixed(1) ?? '—'} ·{' '}
              {connection.user_ratings_total?.toLocaleString() ?? 0} reviews total · last synced{' '}
              {new Date(connection.last_synced_at).toLocaleString()}
            </p>
            {connection.last_sync_error && (
              <p className="text-sm text-red-400 mt-1">
                Last sync error: {connection.last_sync_error}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : 'Refresh now'}
            </button>
            <button
              onClick={disconnect}
              className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white"
            >
              Disconnect
            </button>
          </div>
        </div>
        {msg && <p className="mt-3 text-sm text-gray-300">{msg}</p>}
        <p className="mt-4 text-xs text-gray-500">
          Reviews refresh automatically every week. Google allows up to 5 reviews per business.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="flex items-center gap-2">
        <GoogleG />
        <h2 className="text-lg font-semibold text-white">Import Google Reviews</h2>
      </div>
      <p className="text-sm text-gray-400 mt-1">
        Pull up to 5 of your latest Google reviews into your site. Refreshes weekly.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Business name"
          className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-500"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="City (optional)"
          className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-500"
        />
        <button
          onClick={search}
          disabled={searching || !query.trim()}
          className="px-4 py-2 rounded bg-white text-black text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {msg && <p className="mt-3 text-sm text-gray-300">{msg}</p>}

      {candidates.length > 0 && (
        <ul className="mt-4 space-y-2">
          {pending && (
            <li className="rounded border border-amber-500/40 bg-amber-500/5 p-4">
              <div className="text-sm font-semibold text-white">Is this your business?</div>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">
                These reviews will appear on your site. Check the name and address match you
                before importing.
              </p>

              {pending.nameMismatch && (
                <div className="mt-3 rounded border border-red-500/40 bg-red-500/10 p-3">
                  <div className="text-xs font-semibold text-red-300">
                    This listing has a different name to your business
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-red-200/80">
                    Your site is for{' '}
                    <span className="font-medium">{pending.projectBusinessName || 'this project'}</span>,
                    but this listing is <span className="font-medium">{pending.name}</span>. Importing
                    would put another company&rsquo;s reviews on your site. Only continue if you are
                    certain this is the same business.
                  </p>
                </div>
              )}

              <div className="mt-3 rounded bg-gray-900/60 p-3">
                <div className="font-medium text-white">{pending.name}</div>
                <div className="text-xs text-gray-400">{pending.formatted_address}</div>
                {pending.rating ? (
                  <div className="mt-1 text-xs text-gray-300">
                    ⭐ {pending.rating} · {pending.user_ratings_total ?? 0} reviews
                  </div>
                ) : null}
              </div>

              {pending.sample.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {pending.sample.map((r, i) => (
                    <li key={i} className="rounded bg-gray-900/60 p-2 text-xs text-gray-300">
                      <span className="text-gray-500">
                        {'★'.repeat(Math.max(1, Math.min(5, Math.round(r.rating))))} {r.author}
                      </span>
                      <p className="mt-1 leading-relaxed text-gray-400">{r.text}</p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => connect(pending.place_id, true)}
                  disabled={connecting === pending.place_id}
                  className="rounded bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
                >
                  {connecting === pending.place_id
                    ? 'Importing…'
                    : pending.nameMismatch
                      ? 'Import anyway'
                      : 'Yes, import these'}
                </button>
                <button
                  onClick={() => setPending(null)}
                  className="rounded border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-800"
                >
                  Not my business
                </button>
              </div>
            </li>
          )}

          {candidates.map((c) => (
            <li
              key={c.place_id}
              className="flex items-start justify-between gap-3 bg-gray-800/60 rounded p-3 border border-gray-700"
            >
              <div className="min-w-0">
                <div className="text-white font-medium truncate">{c.name}</div>
                <div className="text-xs text-gray-400 truncate">{c.formatted_address}</div>
                <div className="text-xs text-gray-300 mt-1">
                  {c.rating ? `⭐ ${c.rating} · ${c.user_ratings_total ?? 0} reviews` : 'No rating'}
                </div>
              </div>
              <button
                onClick={() => connect(c.place_id)}
                disabled={connecting === c.place_id}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 shrink-0"
              >
                {connecting === c.place_id ? 'Importing…' : 'This is me'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GoogleG() {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-white text-[11px] font-bold"
      style={{ color: '#4285F4' }}
    >
      G
    </span>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

/**
 * "What to add next", on the owner's home screen.
 *
 * The suggestion API has existed for a while with nothing calling it, which
 * made the whole feature invisible: the product knew a roofer should be
 * collecting quote requests and never said so. This is the surface that asks.
 *
 * The important half is what happens on "Add it". Where we own a component the
 * capability is installed into the site's files immediately -- no model call,
 * no credits, no chance of it quietly not happening. Where we don't, the owner
 * is sent to the editor with a specific instruction rather than being told it
 * is "ready to build" and left to work out what that means.
 */

interface Suggestion {
  id: string;
  label: string;
  whatItDoes: string;
  reason: string;
  adminLabel: string;
  adminHref: string;
}

interface AcceptResponse {
  status?: 'installed' | 'recorded' | 'needs-build';
  message?: string;
  needsRepublish?: boolean;
  editInstruction?: string;
  adminHref?: string;
}

export function CapabilitySuggestions({ projectId }: { projectId: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/suggestions`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function accept(suggestion: Suggestion) {
    if (busyId) return;
    setBusyId(suggestion.id);

    try {
      const res = await fetch(`/api/projects/${projectId}/suggestions/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capabilityId: suggestion.id }),
      });
      const data: AcceptResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || 'That did not go through. Try again in a moment.');
        return;
      }

      if (data.status === 'installed') {
        toast.success(data.message || `${suggestion.label} added.`, {
          description: data.needsRepublish
            ? 'Publish the site to put it live.'
            : undefined,
          duration: 8000,
        });
      } else if (data.status === 'needs-build') {
        toast.info(`${suggestion.label} is ready to build in the editor.`, {
          description: data.editInstruction,
          duration: 10000,
        });
      } else {
        // Recorded but not installed, e.g. the site has not finished
        // generating yet. Say why rather than claiming success.
        toast.message(data.message || 'Saved. We could not add it to the site yet.', {
          duration: 8000,
        });
      }

      // Accepted either way, so it stops being offered.
      setSuggestions((current) => current.filter((entry) => entry.id !== suggestion.id));
    } catch {
      toast.error('That did not go through. Try again in a moment.');
    } finally {
      setBusyId(null);
    }
  }

  // Nothing to say is a valid state: the panel empties as the owner works
  // through it instead of nagging with filler.
  if (loading || suggestions.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="mb-1 text-base font-semibold text-white">What to add next</div>
      <p className="mb-4 text-sm text-gray-500">
        Picked for this business, not a generic list.
      </p>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="rounded-lg border border-gray-800 bg-gray-950/60 p-4 sm:flex sm:items-start sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{suggestion.label}</div>
              <p className="mt-1 text-sm leading-relaxed text-gray-400">
                {suggestion.whatItDoes}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                {suggestion.reason}
              </p>
              <Link
                href={suggestion.adminHref}
                className="mt-2 inline-block text-xs font-medium text-purple-400 hover:text-purple-300"
              >
                {suggestion.adminLabel} &rarr;
              </Link>
            </div>

            <button
              type="button"
              onClick={() => accept(suggestion)}
              disabled={busyId !== null}
              className="mt-3 w-full shrink-0 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-60 sm:mt-0 sm:w-auto"
            >
              {busyId === suggestion.id ? 'Adding…' : 'Add it'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

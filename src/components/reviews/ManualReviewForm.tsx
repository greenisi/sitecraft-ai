'use client';

import { useState } from 'react';

const SOURCES = ['manual', 'yelp', 'facebook', 'angi', 'homeadvisor', 'nextdoor', 'thumbtack', 'other'];

export function ManualReviewForm({
  projectId,
  onAdded,
}: {
  projectId: string;
  onAdded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [source, setSource] = useState('yelp');
  const [externalUrl, setExternalUrl] = useState('');

  function reset() {
    setCustomerName('');
    setRating(5);
    setReviewText('');
    setSource('yelp');
    setExternalUrl('');
  }

  async function submit() {
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          rating,
          review_text: reviewText,
          source,
          external_url: externalUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'failed');
      reset();
      setOpen(false);
      onAdded?.();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left bg-gray-900 border border-dashed border-gray-700 hover:border-gray-500 hover:bg-gray-800/50 rounded-lg p-4 transition"
      >
        <div className="font-medium text-white">+ Add a review manually</div>
        <div className="text-sm text-gray-400 mt-1">
          For reviews from Yelp, Facebook, Angi, HomeAdvisor, or anywhere else.
        </div>
      </button>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Add a review</h3>
        <button
          onClick={() => {
            setOpen(false);
            reset();
            setMsg(null);
          }}
          className="text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2">
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Reviewer name"
          className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-500"
        />
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {'★'.repeat(n)} ({n})
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Review text — paste it word-for-word from the source."
        rows={4}
        className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-500 resize-y"
      />

      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <input
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="Link to original review (optional)"
          className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-500"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        {msg ? <p className="text-sm text-red-400">{msg}</p> : <span />}
        <button
          onClick={submit}
          disabled={submitting || !customerName.trim()}
          className="px-4 py-2 rounded bg-white text-black text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add review'}
        </button>
      </div>
    </div>
  );
}

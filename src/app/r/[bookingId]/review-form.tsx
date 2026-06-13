'use client';

import { useState } from 'react';

export function ReviewForm({ bookingId, token }: { bookingId: string; token: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function submit() {
    if (!rating || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, token, rating, review_text: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Something went wrong');
      setState('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-xl border border-green-800 bg-green-950/40 p-6 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-white font-semibold mb-1">Thank you!</p>
        <p className="text-gray-400 text-sm">Your review means a lot to a small business.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 space-y-5 pk-scale-in">
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-4xl leading-none transition-transform hover:scale-110"
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <span className={(hover || rating) >= star ? 'text-yellow-400' : 'text-gray-700'}>★</span>
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="What stood out? (optional)"
        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-yellow-500 focus:outline-none resize-none"
      />
      <button
        onClick={submit}
        disabled={!rating || state === 'sending'}
        className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-semibold transition-colors"
      >
        {state === 'sending' ? 'Submitting…' : 'Submit review'}
      </button>
      {state === 'error' && <p className="text-sm text-red-400 text-center">{errorMsg}</p>}
    </div>
  );
}

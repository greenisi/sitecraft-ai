'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

export function ContactExchangeForm({ slug }: { slug: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit(formData: FormData) {
    setState('sending');
    setError('');
    const response = await fetch(`/api/cards/public/${slug}/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || 'Could not send your details.');
      setState('idle');
      return;
    }
    setState('sent');
  }

  if (state === 'sent') {
    return (
      <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-center">
        <Check className="mx-auto mb-2 h-5 w-5 text-emerald-300" />
        <p className="font-semibold text-white">You&apos;re connected.</p>
        <p className="mt-1 text-sm text-white/60">Your details were shared successfully.</p>
      </div>
    );
  }

  return (
    <form action={submit} className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
      <div>
        <p className="font-semibold text-white">Share your details back</p>
        <p className="mt-1 text-sm text-white/55">Make this a two-way connection.</p>
      </div>
      <input name="company_website" className="hidden" tabIndex={-1} autoComplete="off" />
      <input required name="full_name" placeholder="Your name" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30" />
      <input required type="email" name="email" placeholder="Email address" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30" />
      <input name="phone" placeholder="Phone (optional)" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30" />
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button disabled={state === 'sending'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60">
        {state === 'sending' ? 'Sending…' : 'Exchange contact details'}
        {state !== 'sending' && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}


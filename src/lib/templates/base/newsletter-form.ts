/**
 * Email list signup -- shipped when the owner accepts the newsletter
 * suggestion.
 *
 * "Recommend a newsletter" has to mean "build the newsletter", otherwise the
 * suggestion panel is just a to-do list handed back to a business owner who
 * came here precisely so they would not have to build things.
 *
 * It posts to the existing submit-form endpoint with form_type 'newsletter',
 * so signups land in the same Leads dashboard as everything else -- no new
 * table, no new admin page, and the owner sees one list of people rather than
 * having to check two places.
 *
 * `PROJECT_ID` is substituted at publish time by platform-publisher.
 */

export function generateNewsletterFormComponent(businessName: string): string {
  const safeName = businessName.replace(/[`$\\]/g, '').trim() || 'us';

  return `'use client';

import { useState } from 'react';

const API_BASE = 'https://app.innovated.marketing/api/sites/PROJECT_ID';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch(API_BASE + '/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          form_type: 'newsletter',
          message: 'Signed up to the email list.',
          source_page: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="bg-primary-900 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
          Keep in touch with ${safeName}
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] leading-relaxed text-white/75">
          Occasional updates worth opening. No spam, and one click to leave whenever you like.
        </p>

        {status === 'done' ? (
          <p className="mt-8 text-lg font-semibold text-white">
            You&rsquo;re on the list &mdash; thank you.
          </p>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-name">Name</label>
            <input
              id="newsletter-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="First name"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3.5 text-[15px] text-white placeholder:text-white/50 sm:w-1/3"
            />
            <label className="sr-only" htmlFor="newsletter-email">Email</label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3.5 text-[15px] text-white placeholder:text-white/50"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="rounded-lg bg-accent-500 px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-accent-600 disabled:opacity-60"
            >
              {status === 'sending' ? 'Joining…' : 'Join the list'}
            </button>
          </form>
        )}

        {status === 'error' ? (
          <p className="mt-4 text-sm text-white/80">
            That didn&rsquo;t go through. Please try again in a moment.
          </p>
        ) : null}
      </div>
    </section>
  );
}
`;
}

/**
 * Reviews section -- shipped when the owner accepts the review-collection
 * suggestion.
 *
 * The reviews backend has existed for a while: a moderation queue, an approval
 * flag, featured ordering, and a Google sync cron. Nothing on a generated site
 * ever read it, and the public endpoint had no CORS, so an owner could approve
 * reviews all day and their site would never show one.
 *
 * Two halves, both driven by the same endpoint:
 *   GET  /api/sites/{id}/reviews  -> approved reviews, featured first
 *   POST /api/sites/{id}/reviews  -> a new review, always unapproved
 *
 * Nothing a visitor submits appears on the site until the owner approves it,
 * and the copy says so rather than implying it posts live.
 *
 * The section renders NOTHING while it has no approved reviews and the owner
 * has not asked for the form: a "What our customers say" heading over an empty
 * space is worse than no section at all on a site that just launched.
 *
 * `PROJECT_ID` is substituted at publish time by platform-publisher.
 */

export interface ReviewsSectionOptions {
  heading: string;
  intro: string;
  /** Prompt above the leave-a-review form, e.g. "Worked with us recently?". */
  invitation: string;
}

export function generateReviewsSectionComponent(options: ReviewsSectionOptions): string {
  const heading = escapeText(options.heading);
  const intro = escapeText(options.intro);
  const invitation = escapeText(options.invitation);

  return `'use client';

import { useEffect, useRef, useState } from 'react';

const API_BASE = 'https://app.innovated.marketing/api/sites/PROJECT_ID';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string | null;
  is_featured: boolean;
  created_at: string;
}

function Stars({ rating, label }: { rating: number; label?: string }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={label || rounded + ' out of 5'}>
      {[1, 2, 3, 4, 5].map((step) => (
        <svg
          key={step}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={'h-4 w-4 ' + (step <= rounded ? 'text-accent-500' : 'text-primary-200')}
          fill="currentColor"
        >
          <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9 4.8 17.6l1-5.8L1.6 7.7l5.8-.8z" />
        </svg>
      ))}
    </span>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API_BASE + '/reviews')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setReviews(data && Array.isArray(data.reviews) ? data.reviews : []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch(API_BASE + '/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_email: email.trim(),
          rating,
          review_text: text.trim(),
          website_url: honeypot.current ? honeypot.current.value : '',
        }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  // Nothing approved yet and nobody asking to write one: stay out of the way.
  if (!loaded || (reviews.length === 0 && !open && status !== 'done')) return null;

  const average =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + (review.rating || 0), 0) / reviews.length
      : 0;

  return (
    <section id="reviews" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-primary-900 sm:text-4xl">
            ${heading}
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] leading-relaxed text-primary-700">
            ${intro}
          </p>
          {reviews.length > 0 ? (
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-primary-700">
              <Stars rating={average} label={'Average ' + average.toFixed(1) + ' out of 5'} />
              <span className="font-semibold text-primary-900">{average.toFixed(1)}</span>
              <span>
                from {reviews.length} review{reviews.length === 1 ? '' : 's'}
              </span>
            </div>
          ) : null}
        </div>

        {reviews.length > 0 ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <figure
                key={review.id}
                className="flex h-full flex-col rounded-xl border border-primary-100 bg-primary-50/60 p-6"
              >
                <Stars rating={review.rating} />
                {review.review_text ? (
                  <blockquote className="mt-4 flex-1 leading-relaxed text-primary-800">
                    {review.review_text}
                  </blockquote>
                ) : null}
                <figcaption className="mt-4 text-sm font-semibold text-primary-900">
                  {review.customer_name}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}

        <div className="mt-12 text-center">
          {status === 'done' ? (
            <p className="mx-auto max-w-[52ch] leading-relaxed text-primary-800">
              Thank you &mdash; your review has been sent. It appears here once it has been read.
            </p>
          ) : open ? (
            <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 text-left">
              <div>
                <span className="block text-sm font-semibold text-primary-900">Your rating</span>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setRating(step)}
                      aria-label={step + ' star' + (step === 1 ? '' : 's')}
                      aria-pressed={rating === step}
                      className="p-1"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className={'h-7 w-7 ' + (step <= rating ? 'text-accent-500' : 'text-primary-200')}
                        fill="currentColor"
                      >
                        <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9 4.8 17.6l1-5.8L1.6 7.7l5.8-.8z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="review-name" className="block text-sm font-semibold text-primary-900">
                  Your name
                </label>
                <input
                  id="review-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-4 py-3.5 text-[15px] text-primary-900"
                />
              </div>

              <div>
                <label htmlFor="review-email" className="block text-sm font-semibold text-primary-900">
                  Email <span className="font-normal text-primary-500">(not shown on the site)</span>
                </label>
                <input
                  id="review-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-4 py-3.5 text-[15px] text-primary-900"
                />
              </div>

              <div>
                <label htmlFor="review-text" className="block text-sm font-semibold text-primary-900">
                  How did it go?
                </label>
                <textarea
                  id="review-text"
                  rows={4}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-4 py-3.5 text-[15px] text-primary-900"
                />
              </div>

              <input
                ref={honeypot}
                type="text"
                name="website_url"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute h-px w-px overflow-hidden opacity-0"
              />

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full rounded-lg bg-accent-500 px-7 py-4 text-[15px] font-bold text-white transition-colors hover:bg-accent-600 disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending…' : 'Send review'}
              </button>

              <p className="text-center text-sm leading-relaxed text-primary-600">
                Reviews are read before they appear on the site.
              </p>

              {status === 'error' ? (
                <p className="text-center text-sm text-primary-700">
                  That didn&rsquo;t go through. Please try again in a moment.
                </p>
              ) : null}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg border border-primary-200 px-7 py-3.5 text-[15px] font-bold text-primary-900 transition-colors hover:bg-primary-50"
            >
              ${invitation}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
`;
}

/** Strips characters that would break out of the generated template literal. */
function escapeText(value: string): string {
  return value.replace(/[`\\]/g, '').replace(/\$\{/g, '');
}

/**
 * Review framing per trade. The noun for the work differs -- a clinic has
 * patients, a restaurant has diners, a contractor has jobs -- and the generic
 * version reads like every other site.
 */
export function deriveReviewsOptions(siteType: string, industry: string): ReviewsSectionOptions {
  const trade = `${siteType} ${industry}`.toLowerCase();

  if (/restaurant|cafe|dining|bar|food|bakery|catering/.test(trade)) {
    return {
      heading: 'What our guests say',
      intro: 'Reviews from people who have eaten with us.',
      invitation: 'Write a review',
    };
  }
  if (/health|medical|clinic|dental|therapy|chiropract|veterinar/.test(trade)) {
    return {
      heading: 'What our patients say',
      intro: 'Reviews from people we have looked after.',
      invitation: 'Share your experience',
    };
  }
  if (/salon|spa|barber|beauty|massage|aesthetic|grooming/.test(trade)) {
    return {
      heading: 'What our clients say',
      intro: 'Reviews from people who sit in our chairs.',
      invitation: 'Share your experience',
    };
  }
  if (/gym|fitness|yoga|pilates|training|coach|studio/.test(trade)) {
    return {
      heading: 'What our members say',
      intro: 'Reviews from people training with us.',
      invitation: 'Share your experience',
    };
  }
  if (/contractor|roof|plumb|hvac|electric|landscap|clean|construction|remodel|repair/.test(trade)) {
    return {
      heading: 'What our customers say',
      intro: 'Reviews from people whose jobs we have finished.',
      invitation: 'Review your job',
    };
  }

  return {
    heading: 'What our customers say',
    intro: 'Reviews from people we have worked with.',
    invitation: 'Write a review',
  };
}

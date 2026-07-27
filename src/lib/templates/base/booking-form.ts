/**
 * Booking form -- shipped with every generated site, wired to the real
 * bookings endpoint.
 *
 * The backend for this has existed since Phase 3 (slot-conflict detection,
 * owner Confirm/Decline emails, customer acknowledgement) but nothing emitted
 * a front end for it: a grep across the scaffold templates returned no booking
 * UI at all. Sites either got whatever contact form the model improvised, or
 * FormAutoWire guessing that a form with a date field was a booking.
 *
 * This is the same unified flow the template previews use -- pick a date, pick
 * a time, give your details, submit once -- except it talks to the live API:
 *   GET  /api/sites/{id}/bookings?date=YYYY-MM-DD -> { available_slots }
 *   POST /api/sites/{id}/bookings                 -> creates a pending booking
 *
 * Deliberately ONE submit. Splitting "send a message" from "request a booking"
 * makes the visitor guess which one the business actually reads, so the
 * contact fields live inside the booking flow and travel with the slot.
 *
 * `PROJECT_ID` is substituted with the real project id at publish time by
 * platform-publisher.
 */

export interface BookingFormOptions {
  /** e.g. "Reserve a table" / "Book an appointment". */
  heading: string;
  intro: string;
  /** e.g. "Party size" / "Reason for visit" / "Service". */
  choiceLabel: string;
  /** Options for the select: real services, party sizes, class names. */
  choices: string[];
}

export function generateBookingFormComponent(options: BookingFormOptions): string {
  const choices = JSON.stringify(options.choices);

  return `'use client';

import { useEffect, useState } from 'react';

const API_BASE = 'https://app.innovated.marketing/api/sites/PROJECT_ID';
const CHOICES: string[] = ${choices};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
/** Mirrors the server's slot list; used until real availability arrives. */
const FALLBACK_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

function iso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}

function label(time: string): string {
  const [rawHour, minute] = time.split(':');
  const hour = Number(rawHour);
  const suffix = hour >= 12 ? 'pm' : 'am';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return display + ':' + minute + ' ' + suffix;
}

export default function BookingForm() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>(FALLBACK_SLOTS);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [choice, setChoice] = useState(CHOICES[0] || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  // Real availability, so slots another customer already took disappear.
  // A failed request falls back to the full list rather than blocking booking.
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setLoadingSlots(true);
    setTime(null);
    fetch(API_BASE + '/bookings?date=' + date)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const available = data && Array.isArray(data.available_slots) ? data.available_slots : FALLBACK_SLOTS;
        setSlots(available);
      })
      .catch(() => {
        if (!cancelled) setSlots(FALLBACK_SLOTS);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const ready = Boolean(date && time && name.trim() && email.trim());

  async function submit() {
    if (!ready || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch(API_BASE + '/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.trim(),
          booking_date: date,
          booking_time: time,
          service_type: choice,
          notes: notes.trim(),
          source_page: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const firstWeekday = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const dayCount = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let blank = 0; blank < firstWeekday; blank += 1) cells.push(null);
  for (let day = 1; day <= dayCount; day += 1) cells.push(new Date(view.getFullYear(), view.getMonth(), day));

  const summary = (() => {
    if (!date) return 'Choose a date to get started.';
    const parts = date.split('-').map(Number);
    const picked = new Date(parts[0], parts[1] - 1, parts[2]);
    const when = DAYS[picked.getDay()] + ' ' + picked.getDate() + ' ' + MONTHS[picked.getMonth()];
    if (!time) return when + ' — now pick a time.';
    const line = when + ' at ' + label(time) + (choice ? ' · ' + choice : '');
    if (!name.trim() || !email.trim()) return line + ' — add your name and email to confirm.';
    return line + ' · ' + name.trim() + ' (' + email.trim() + ')';
  })();

  if (status === 'done') {
    return (
      <section id="book" className="bg-neutral-50 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="font-heading text-3xl font-bold text-neutral-900">Request received</h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            We have your request and will confirm by email shortly. If you need to change anything,
            just reply to that email.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="book" className="bg-neutral-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-11">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-600">Availability</p>
          <h2 className="max-w-2xl font-heading text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
            ${options.heading}
          </h2>
          <p className="mt-4 max-w-[56ch] leading-relaxed text-neutral-600">${options.intro}</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Step 1 — date */}
            <div className="border-neutral-200 p-7 lg:border-r">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-accent-600">
                  Step 1 — Pick a date
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => {
                      const previous = new Date(view.getFullYear(), view.getMonth() - 1, 1);
                      const floor = new Date(today.getFullYear(), today.getMonth(), 1);
                      setView(previous < floor ? floor : previous);
                    }}
                    className="h-9 w-9 rounded-lg border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    &lsaquo;
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
                    className="h-9 w-9 rounded-lg border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    &rsaquo;
                  </button>
                </div>
              </div>

              <div className="mb-4 font-heading text-xl font-bold text-neutral-900">
                {MONTHS[view.getMonth()] + ' ' + view.getFullYear()}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {DOW.map((day) => (
                  <div key={day} className="pb-2 text-center text-[11px] uppercase tracking-wider text-neutral-400">
                    {day}
                  </div>
                ))}
                {cells.map((cell, index) => {
                  if (!cell) return <div key={'blank-' + index} />;
                  const value = iso(cell);
                  const unavailable = cell < today || cell.getDay() === 0;
                  const selected = value === date;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={unavailable}
                      onClick={() => setDate(value)}
                      className={
                        'aspect-square rounded-lg border text-sm transition-colors ' +
                        (unavailable
                          ? 'cursor-default border-transparent text-neutral-300'
                          : selected
                            ? 'border-transparent bg-primary-600 font-semibold text-white'
                            : 'border-transparent text-neutral-800 hover:border-neutral-300')
                      }
                    >
                      {cell.getDate()}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-neutral-500">Sundays and past dates are unavailable.</p>
            </div>

            {/* Step 2 — time */}
            <div className="p-7">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-accent-600">
                Step 2 — Pick a time
              </div>
              {!date ? (
                <p className="mb-6 text-sm text-neutral-500">Choose a date to see what is free.</p>
              ) : loadingSlots ? (
                <p className="mb-6 text-sm text-neutral-500">Checking availability…</p>
              ) : slots.length === 0 ? (
                <p className="mb-6 text-sm text-neutral-600">
                  Fully booked that day — try another date.
                </p>
              ) : (
                <div className="mb-7 grid grid-cols-3 gap-2.5">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={
                        'rounded-lg border px-2 py-3 text-sm font-semibold transition-colors ' +
                        (slot === time
                          ? 'border-transparent bg-primary-600 text-white'
                          : 'border-neutral-200 text-neutral-800 hover:border-neutral-400')
                      }
                    >
                      {label(slot)}
                    </button>
                  ))}
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-accent-600">
                  ${options.choiceLabel}
                </span>
                <select
                  value={choice}
                  onChange={(event) => setChoice(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-3 text-[15px] text-neutral-900"
                >
                  {CHOICES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Step 3 — details, submitted together with the slot */}
          <div className="border-t border-neutral-200 p-7">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-accent-600">
              Step 3 — Your details
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-neutral-700">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3.5 py-3 text-[15px] text-neutral-900"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-neutral-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3.5 py-3 text-[15px] text-neutral-900"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-neutral-700">
                  Phone <span className="font-semibold text-neutral-400">(optional)</span>
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3.5 py-3 text-[15px] text-neutral-900"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-neutral-700">
                  Anything we should know <span className="font-semibold text-neutral-400">(optional)</span>
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full resize-y rounded-lg border border-neutral-200 px-3.5 py-3 text-[15px] text-neutral-900"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-5 border-t border-neutral-200 bg-primary-50 px-7 py-6">
            <div className="min-w-[240px] flex-1">
              <div className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-accent-600">Your booking</div>
              <div className="text-[15px] leading-relaxed text-neutral-900">{summary}</div>
              {status === 'error' ? (
                <div className="mt-2 text-sm text-red-700">
                  That did not go through. Please try again, or call us instead.
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={!ready || status === 'sending'}
              className="rounded-lg bg-primary-600 px-9 py-4 text-[15px] font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending…' : 'Request this booking'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
`;
}

/**
 * Booking framing per site type. A restaurant books a table, a clinic books an
 * appointment, a trade books a visit -- the wrong noun makes the whole section
 * read as generic.
 */
export function deriveBookingOptions(siteType: string, industry: string): BookingFormOptions {
  const trade = `${siteType} ${industry}`.toLowerCase();
  // Deliberately NOT derived from a service list: the config has no structured
  // one, and inventing service names here would put words in the owner's mouth
  // on a form that emails real customers. Neutral options the owner can edit.
  const list = ['New enquiry', 'Existing customer', 'Something else'];

  if (/restaurant|cafe|dining|bar|food/.test(trade)) {
    return {
      heading: 'Reserve a table',
      intro: 'Pick an evening and a sitting. We hold the table for fifteen minutes past your time.',
      choiceLabel: 'Party size',
      choices: ['2 guests', '3 guests', '4 guests', '5 guests', '6 guests', '7+ (call us)'],
    };
  }
  if (/health|medical|clinic|dental|wellness|therapy|salon|spa|beauty/.test(trade)) {
    return {
      heading: 'Book an appointment',
      intro: 'Choose a time that suits you and we will confirm by email.',
      choiceLabel: 'Reason for visit',
      choices: list,
    };
  }
  if (/fitness|gym|studio|coach|training/.test(trade)) {
    return {
      heading: 'Book your first session',
      intro: 'Pick a slot and we will have someone expecting you.',
      choiceLabel: 'Session',
      choices: list,
    };
  }
  if (/service|repair|contractor|landscap|roof|plumb|hvac|clean|construction/.test(trade)) {
    return {
      heading: 'Book a visit',
      intro: 'Choose a day that works and we will confirm the window by email.',
      choiceLabel: 'What do you need?',
      choices: list,
    };
  }
  return {
    heading: 'Book a time to talk',
    intro: 'Pick a slot that works and we will confirm by email. Every enquiry is answered by a person.',
    choiceLabel: 'What is this about?',
    choices: list,
  };
}

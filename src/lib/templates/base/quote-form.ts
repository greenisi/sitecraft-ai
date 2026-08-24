/**
 * Quote request form -- shipped when the owner accepts the quote-requests
 * suggestion.
 *
 * The capability promises "visitors describe the job and get a quote request in
 * front of you, with photos if they have them", so this builds exactly that
 * rather than handing the owner a to-do. A trade quoting a roof or a driveway
 * cannot price anything from a name and an email; what makes the difference is
 * the job description and a couple of photos, so those are the fields the form
 * is actually built around.
 *
 * It posts multipart/form-data to the existing submit-form endpoint, which
 * already accepts up to three images at 5MB each and uploads them to
 * project-assets. Nothing new server-side:
 *   POST /api/sites/{id}/submit-form  (form_type 'quote')
 *
 * Submissions land in the same Leads dashboard as every other enquiry, so the
 * owner keeps one list of people to call rather than two.
 *
 * `website_url` is the honeypot spam-guard already checks. It is visually
 * hidden rather than display:none so that the layout cost is zero while
 * bots still fill it in.
 *
 * `PROJECT_ID` is substituted with the real project id at publish time by
 * platform-publisher.
 */

export interface QuoteFormOptions {
  /** e.g. "Get a free quote" / "Request an estimate". */
  heading: string;
  intro: string;
  /** e.g. "What do you need?" -- labels the job-type select. */
  choiceLabel: string;
  /** Neutral job types. Never invented service names; see deriveQuoteOptions. */
  choices: string[];
}

export function generateQuoteFormComponent(options: QuoteFormOptions): string {
  const choices = JSON.stringify(options.choices);
  const heading = escapeText(options.heading);
  const intro = escapeText(options.intro);
  const choiceLabel = escapeText(options.choiceLabel);

  return `'use client';

import { useRef, useState } from 'react';

const API_BASE = 'https://app.innovated.marketing/api/sites/PROJECT_ID';
const CHOICES: string[] = ${choices};
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export default function QuoteRequestForm() {
  const [choice, setChoice] = useState(CHOICES[0] || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoNote, setPhotoNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const honeypot = useRef<HTMLInputElement>(null);

  // Oversized or non-image files are dropped here rather than at the server,
  // so the visitor is told immediately instead of watching a submit succeed
  // with their photo silently missing.
  function pickPhotos(list: FileList | null) {
    if (!list) return;
    const accepted: File[] = [];
    let rejected = 0;
    for (const file of Array.from(list)) {
      if (!file.type.startsWith('image/') || file.size > MAX_PHOTO_BYTES) {
        rejected += 1;
        continue;
      }
      accepted.push(file);
    }
    const next = [...photos, ...accepted].slice(0, MAX_PHOTOS);
    setPhotos(next);
    if (rejected > 0) {
      setPhotoNote('Skipped ' + rejected + ' file' + (rejected === 1 ? '' : 's') + ' — photos only, up to 5MB each.');
    } else if (accepted.length + photos.length > MAX_PHOTOS) {
      setPhotoNote('Using the first ' + MAX_PHOTOS + ' photos.');
    } else {
      setPhotoNote('');
    }
  }

  function removePhoto(index: number) {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoNote('');
  }

  const ready = Boolean(name.trim() && email.trim() && details.trim());

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || status === 'sending') return;
    setStatus('sending');

    try {
      const payload = new FormData();
      payload.append('name', name.trim());
      payload.append('email', email.trim());
      payload.append('phone', phone.trim());
      payload.append('service_needed', choice);
      payload.append('message', details.trim());
      payload.append('form_type', 'quote');
      payload.append('website_url', honeypot.current ? honeypot.current.value : '');
      payload.append('source_page', typeof window !== 'undefined' ? window.location.pathname : '');
      for (const photo of photos) {
        payload.append('images', photo);
      }

      const res = await fetch(API_BASE + '/submit-form', { method: 'POST', body: payload });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <section id="quote" className="bg-primary-50 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="font-heading text-3xl font-bold text-primary-900 sm:text-4xl">
            Request received
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] leading-relaxed text-primary-700">
            We have your details and will come back to you with a quote. If it is urgent,
            calling is always faster.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="quote" className="bg-primary-50 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-primary-900 sm:text-4xl">
            ${heading}
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] leading-relaxed text-primary-700">
            ${intro}
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 space-y-5">
          <div>
            <label htmlFor="quote-choice" className="block text-sm font-semibold text-primary-900">
              ${choiceLabel}
            </label>
            <select
              id="quote-choice"
              value={choice}
              onChange={(event) => setChoice(event.target.value)}
              className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-4 py-3.5 text-[15px] text-primary-900"
            >
              {CHOICES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quote-details" className="block text-sm font-semibold text-primary-900">
              Tell us about the job
            </label>
            <textarea
              id="quote-details"
              required
              rows={5}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Rough size, condition, and anything we should know before quoting."
              className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-4 py-3.5 text-[15px] text-primary-900 placeholder:text-primary-400"
            />
          </div>

          <div>
            <span className="block text-sm font-semibold text-primary-900">
              Photos <span className="font-normal text-primary-500">(optional, up to {MAX_PHOTOS})</span>
            </span>
            <p className="mt-1 text-sm leading-relaxed text-primary-600">
              A couple of photos usually means a firmer number and one less visit.
            </p>
            <input
              id="quote-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => pickPhotos(event.target.files)}
              className="mt-2 block w-full text-sm text-primary-700 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-900 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white"
            />
            {photos.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {photos.map((photo, index) => (
                  <li key={photo.name + index} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-primary-700">
                    <span className="truncate">{photo.name}</span>
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="shrink-0 font-semibold text-primary-500 hover:text-primary-900"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {photoNote ? <p className="mt-2 text-sm text-primary-600">{photoNote}</p> : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="quote-name" className="block text-sm font-semibold text-primary-900">Your name</label>
              <input
                id="quote-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-4 py-3.5 text-[15px] text-primary-900"
              />
            </div>
            <div>
              <label htmlFor="quote-phone" className="block text-sm font-semibold text-primary-900">Phone</label>
              <input
                id="quote-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-4 py-3.5 text-[15px] text-primary-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="quote-email" className="block text-sm font-semibold text-primary-900">Email</label>
            <input
              id="quote-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
            disabled={!ready || status === 'sending'}
            className="w-full rounded-lg bg-accent-500 px-7 py-4 text-[15px] font-bold text-white transition-colors hover:bg-accent-600 disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : 'Request my quote'}
          </button>

          {status === 'error' ? (
            <p className="text-center text-sm text-primary-700">
              That didn&rsquo;t go through. Please try again in a moment.
            </p>
          ) : null}
        </form>
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
 * Frames the quote request per trade.
 *
 * Job types are deliberately NEUTRAL rather than derived from a service list.
 * The generation config has no structured services, and inventing them here
 * would put words in the owner's mouth on a form that emails real customers --
 * the same reasoning as deriveBookingOptions. The owner edits them once and
 * they are right forever.
 */
export function deriveQuoteOptions(siteType: string, industry: string): QuoteFormOptions {
  const trade = `${siteType} ${industry}`.toLowerCase();
  const generic = ['New job', 'Repair', 'Maintenance', 'Something else'];

  if (/roof|gutter|siding/.test(trade)) {
    return {
      heading: 'Get a free roofing quote',
      intro: 'Tell us what you are seeing and send a photo if you can. Most quotes come back the same day.',
      choiceLabel: 'What do you need?',
      choices: ['Leak or repair', 'Full replacement', 'Inspection', 'Something else'],
    };
  }
  if (/landscap|lawn|garden|tree|paving|fencing/.test(trade)) {
    return {
      heading: 'Get a quote for your yard',
      intro: 'Describe the space and add a photo or two. We will come back with a number and a timeline.',
      choiceLabel: 'What are you after?',
      choices: ['One-off job', 'Regular maintenance', 'Full redesign', 'Something else'],
    };
  }
  if (/plumb|hvac|electric|heating|cooling/.test(trade)) {
    return {
      heading: 'Request an estimate',
      intro: 'Tell us the problem and how urgent it is. Photos of the unit or the leak help us quote accurately.',
      choiceLabel: 'What do you need?',
      choices: ['Emergency repair', 'Repair', 'New installation', 'Service or maintenance'],
    };
  }
  if (/clean|pest|junk|moving/.test(trade)) {
    return {
      heading: 'Get a price',
      intro: 'Tell us the size of the job and when you need it done. Photos make the quote firmer.',
      choiceLabel: 'What do you need?',
      choices: ['One-off visit', 'Regular schedule', 'Move-in or move-out', 'Something else'],
    };
  }
  if (/remodel|renovat|construction|contractor|flooring|painting|window|kitchen|bath/.test(trade)) {
    return {
      heading: 'Get a project quote',
      intro: 'Describe what you have in mind and send photos of the space. We will come back with a realistic number.',
      choiceLabel: 'What is the project?',
      choices: ['Full project', 'Partial work', 'Repair', 'Not sure yet'],
    };
  }

  return {
    heading: 'Get a free quote',
    intro: 'Tell us about the job and add photos if you have them. Every request is answered by a person.',
    choiceLabel: 'What do you need?',
    choices: generic,
  };
}

/**
 * Section kit -- premium section components shipped with every generated site.
 *
 * The system prompt asks the model to hand-build icon grids, process
 * timelines, quote bands, FAQ accordions, marquees and gallery mosaics from
 * scratch on every generation. That is the single biggest source of variance:
 * the layout, the spacing, the contrast handling and the motion all get
 * re-derived each time, so they land maybe seven times in ten and differently
 * every time.
 *
 * These components remove that variance. The model no longer decides HOW a
 * timeline is built -- only that a page has one, and what goes in it. Same
 * split that made SectionDivider and DynamicsRuntime reliable: the structure
 * is ours, the content is the model's.
 *
 * Rules every component here follows:
 * - design-system tokens only (primary/secondary/accent/neutral + font-heading),
 *   so they inherit each site's palette automatically;
 * - light surface -> dark type, dark surface -> white type, never a mid shade
 *   as a background;
 * - fail-open: nothing depends on JavaScript to become visible. The accordion
 *   is a <details>, stat numerals render their final value, motion is CSS or
 *   the shared DynamicsRuntime;
 * - no external dependencies, no icon library -- inline SVG only.
 */

export interface SectionKitFile {
  path: string;
  content: string;
}

const ICON_GRID = `interface IconGridItem {
  title: string;
  blurb: string;
}

interface IconGridProps {
  eyebrow?: string;
  heading: string;
  items: IconGridItem[];
  /** 'center' suits broad claims; 'left' suits detailed, editorial copy. */
  align?: 'left' | 'center';
}

const ICONS = [
  <path key="a" d="M12 2 3 7v10l9 5 9-5V7z" />,
  <path key="b" d="M12 7v5l3 3" />,
  <path key="c" d="M3 12h4l3 8 4-16 3 8h4" />,
  <path key="d" d="M12 3l2.6 5.6 6.4.8-4.7 4.3 1.3 6.3-5.6-3.1-5.6 3.1 1.3-6.3L3 9.4l6.4-.8z" />,
  <path key="e" d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />,
  <path key="f" d="M20 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z" />,
];

export default function IconGrid({ eyebrow, heading, items, align = 'center' }: IconGridProps) {
  return (
    <section className="relative overflow-hidden bg-neutral-50 py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={\`mb-12 \${align === 'center' ? 'text-center' : ''}\`}>
          {eyebrow ? (
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-600">{eyebrow}</p>
          ) : null}
          <h2
            className={\`font-heading text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl \${
              align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'
            }\`}
          >
            {heading}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-neutral-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-xl bg-primary-50 p-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7 text-primary-600"
                >
                  {ICONS[index % ICONS.length]}
                </svg>
              </div>
              <h3 className="mb-2 font-heading text-lg font-bold text-neutral-900">{item.title}</h3>
              <p className="text-[15px] leading-relaxed text-neutral-600">{item.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

const PROCESS_TIMELINE = `interface Step {
  title: string;
  blurb: string;
}

interface ProcessTimelineProps {
  eyebrow?: string;
  heading: string;
  steps: Step[];
}

export default function ProcessTimeline({ eyebrow, heading, steps }: ProcessTimelineProps) {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          {eyebrow ? (
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-600">{eyebrow}</p>
          ) : null}
          <h2 className="max-w-2xl font-heading text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
            {heading}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title}>
              {/* Outlined numeral: a display moment that costs no extra content. */}
              <div
                className="font-heading text-6xl font-extrabold leading-none text-transparent"
                style={{ WebkitTextStroke: '1.4px var(--kit-rule, currentColor)' }}
              >
                <span className="text-primary-300">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="my-4 h-0.5 bg-gradient-to-r from-primary-500 to-transparent" />
              <h3 className="mb-2 font-heading text-lg font-bold text-neutral-900">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-neutral-600">{step.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

const QUOTE_BAND = `interface QuoteBandProps {
  quote: string;
  name: string;
  role: string;
  /** Full-bleed backdrop photograph. */
  image: string;
  alt: string;
}

export default function QuoteBand({ quote, name, role, image, alt }: QuoteBandProps) {
  return (
    <section className="relative overflow-hidden py-24 sm:py-28">
      {/* data-parallax is picked up by DynamicsRuntime and drifted on scroll. */}
      <img
        src={image}
        alt={alt}
        data-parallax="0.3"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/90 via-neutral-950/70 to-neutral-950/50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <figure className="max-w-3xl rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-xl sm:p-10">
          <div className="mb-3 font-heading text-5xl leading-none text-accent-400">&ldquo;</div>
          <blockquote className="font-heading text-xl leading-snug text-white sm:text-2xl">
            {quote}
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-3">
            <div className="h-0.5 w-9 bg-accent-400" />
            <div>
              <div className="text-sm font-bold text-white">{name}</div>
              <div className="text-xs text-white/70">{role}</div>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
`;

const FAQ_ACCORDION = `interface Faq {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  eyebrow?: string;
  heading: string;
  faqs: Faq[];
}

/**
 * Built on <details> so it opens and closes with JavaScript disabled. The
 * first entry ships open so the section never reads as an empty list.
 */
export default function FaqAccordion({ eyebrow, heading, faqs }: FaqAccordionProps) {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          {eyebrow ? (
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-600">{eyebrow}</p>
          ) : null}
          <h2 className="font-heading text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
            {heading}
          </h2>
        </div>
        <div>
          {faqs.map((faq, index) => (
            <details
              key={faq.q}
              open={index === 0}
              className="group border-b border-neutral-200 py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-5 font-heading text-lg font-bold text-neutral-900">
                {faq.q}
                <span className="text-2xl leading-none text-primary-600 transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-[70ch] leading-relaxed text-neutral-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
`;

const MARQUEE = `interface MarqueeProps {
  /** Short words: services, materials, neighbourhoods. */
  words: string[];
}

/**
 * Infinite keyword band. The row is rendered twice so the CSS translate loop
 * is seamless; animate-marquee is defined in the site's Tailwind config.
 */
export default function Marquee({ words }: MarqueeProps) {
  const row = (
    <div className="flex shrink-0 items-center gap-7 pr-7">
      {words.map((word) => (
        <span
          key={word}
          className="flex items-center gap-7 whitespace-nowrap font-heading text-2xl font-bold text-white sm:text-3xl"
        >
          {word}
          <span className="inline-block h-2 w-2 rounded-full bg-accent-400" />
        </span>
      ))}
    </div>
  );

  return (
    <section aria-hidden="true" className="overflow-hidden bg-primary-900 py-6">
      <div className="flex w-max animate-marquee">
        {row}
        {row}
      </div>
    </section>
  );
}
`;

const GALLERY_MOSAIC = `interface GalleryImage {
  src: string;
  alt: string;
}

interface GalleryMosaicProps {
  eyebrow?: string;
  heading: string;
  images: GalleryImage[];
}

/**
 * One tall frame beside a stack of two -- mixed aspect ratios rather than a
 * uniform grid, which is what stops a gallery reading as a contact sheet.
 */
export default function GalleryMosaic({ eyebrow, heading, images }: GalleryMosaicProps) {
  const [lead, ...rest] = images;
  if (!lead) return null;

  return (
    <section className="bg-neutral-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-11">
          {eyebrow ? (
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-600">{eyebrow}</p>
          ) : null}
          <h2 className="max-w-2xl font-heading text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
            {heading}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={lead.src}
              alt={lead.alt}
              className="h-full min-h-[380px] w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
          <div className="grid gap-5">
            {rest.slice(0, 2).map((image) => (
              <div key={image.src} className="overflow-hidden rounded-2xl">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-[180px] w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
`;

const STAT_BAND = `interface Stat {
  value: string;
  label: string;
}

interface StatBandProps {
  stats: Stat[];
}

/**
 * Numerals render their FINAL value. DynamicsRuntime counts them up on scroll,
 * so a script failure leaves the finished figure on screen rather than a zero.
 */
export default function StatBand({ stats }: StatBandProps) {
  return (
    <section className="border-y border-neutral-200 bg-white py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 text-center sm:grid-cols-3 sm:px-6 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="font-heading text-4xl font-extrabold leading-none text-primary-600 sm:text-5xl">
              {stat.value}
            </div>
            <div className="mt-3 text-xs uppercase tracking-[0.14em] text-neutral-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
`;

const OFFSET_IMAGE = `interface OffsetImageProps {
  src: string;
  alt: string;
  /** Tailwind height class, e.g. "h-[420px]". */
  heightClass?: string;
}

/**
 * Photograph with a brand-coloured block offset behind it. Cheap depth, and
 * the single most reliable way to stop an image reading as a bare rectangle.
 */
export default function OffsetImage({ src, alt, heightClass = 'h-[420px]' }: OffsetImageProps) {
  return (
    <div className="relative pb-5 pr-5">
      <div aria-hidden="true" className="absolute bottom-0 right-0 h-[78%] w-[72%] rounded-2xl bg-primary-100" />
      <div className="relative overflow-hidden rounded-2xl">
        <img src={src} alt={alt} className={\`w-full \${heightClass} object-cover\`} />
      </div>
    </div>
  );
}
`;

/** Every kit component, ready to be written into a generated project. */
export function generateSectionKitFiles(): SectionKitFile[] {
  return [
    { path: 'src/components/kit/IconGrid.tsx', content: ICON_GRID },
    { path: 'src/components/kit/ProcessTimeline.tsx', content: PROCESS_TIMELINE },
    { path: 'src/components/kit/QuoteBand.tsx', content: QUOTE_BAND },
    { path: 'src/components/kit/FaqAccordion.tsx', content: FAQ_ACCORDION },
    { path: 'src/components/kit/Marquee.tsx', content: MARQUEE },
    { path: 'src/components/kit/GalleryMosaic.tsx', content: GALLERY_MOSAIC },
    { path: 'src/components/kit/StatBand.tsx', content: STAT_BAND },
    { path: 'src/components/kit/OffsetImage.tsx', content: OFFSET_IMAGE },
  ];
}

/**
 * Prompt block describing the kit. Deliberately short and prop-shaped: the
 * model's job is to choose sections and write content, never to re-implement
 * the layout.
 */
export function buildSectionKitPromptBlock(): string {
  return `=== SECTION KIT — PRE-BUILT, IMPORT THEM, DO NOT REBUILD THEM ===
Every generated site ships with these components already written and styled to
the design system. Import and pass props. NEVER hand-roll an icon grid, a
process timeline, a testimonial band, an FAQ, a marquee, a gallery, or a stat
row — yours will be worse and inconsistent with the rest of the site.

import IconGrid from '@/components/kit/IconGrid';
  <IconGrid eyebrow="Why us" heading="..." align="left|center"
            items={[{ title, blurb }, ...3 items]} />

import ProcessTimeline from '@/components/kit/ProcessTimeline';
  <ProcessTimeline eyebrow="How it works" heading="..."
                   steps={[{ title, blurb }, ...3-4 steps]} />

import QuoteBand from '@/components/kit/QuoteBand';
  <QuoteBand quote="..." name="..." role="..." image="<verified unsplash url>" alt="..." />

import FaqAccordion from '@/components/kit/FaqAccordion';
  <FaqAccordion eyebrow="Questions" heading="..." faqs={[{ q, a }, ...3 items]} />

import Marquee from '@/components/kit/Marquee';
  <Marquee words={["...", "..."]} />   // 5-7 short service/material words

import GalleryMosaic from '@/components/kit/GalleryMosaic';
  <GalleryMosaic eyebrow="Recent work" heading="..."
                 images={[{ src, alt }, ...3 images]} />

import StatBand from '@/components/kit/StatBand';
  <StatBand stats={[{ value: "12", label: "..." }, ...3 stats]} />

import OffsetImage from '@/components/kit/OffsetImage';
  <OffsetImage src="..." alt="..." heightClass="h-[420px]" />

CONTENT RULES: every value you pass must be true for THIS business and specific
to it. Never invent ratings, awards, years in business, customer counts, or
statistics — if you do not have a real number, use a StatBand fact you can
stand behind (service area, team size, response time) or omit the section.`;
}

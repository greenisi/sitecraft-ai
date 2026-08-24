/**
 * Section and decoration library for template preview pages.
 *
 * The first pass at interior pages was structurally honest but visually thin —
 * a header, some rows, a stat band. A premium WordPress theme demo (Salient,
 * Avada, Divi) earns its look from four things this module supplies:
 *
 *   1. density — 8-12 sections per page, each with a distinct job,
 *   2. variety — icon grids, timelines, quotes, accordions, marquees,
 *   3. shape   — wave/skew dividers so sections interlock instead of stacking,
 *   4. depth   — offset colour blocks, overlapping cards, floating chips.
 *
 * Everything here is inline-styled, JS-free, and fail-open: the accordion is a
 * <details>, the counters render their final value, and motion is CSS only.
 */
import type { PreviewTheme } from './preview-pages';

export interface Palette {
  txt: string;
  muted: string;
  surface: string;
  alt: string;
  card: string;
  brd: string;
}

export function palette(theme: PreviewTheme): Palette {
  return theme.isDark
    ? { txt: '#fafaf9', muted: '#a1a1aa', surface: '#09090b', alt: '#111113', card: '#18181b', brd: '#27272a' }
    : { txt: '#09090b', muted: '#71717a', surface: '#ffffff', alt: '#fafaf9', card: '#ffffff', brd: '#e4e4e7' };
}

// --------------------------------------------------------------------------
// Shape dividers — the single strongest "this is a theme demo" signal
// --------------------------------------------------------------------------

export type DividerVariant = 'wave' | 'skew' | 'curve' | 'notch';

/** Sits at the bottom of a section; `fill` must be the NEXT section's colour. */
export function divider(variant: DividerVariant, fill: string): string {
  const shapes: Record<DividerVariant, string> = {
    wave: '<path d="M0,64 C240,120 480,8 720,32 C960,56 1200,112 1440,72 L1440,120 L0,120 Z"/>',
    curve: '<path d="M0,120 C360,20 1080,20 1440,120 Z"/>',
    skew: '<path d="M0,120 L1440,24 L1440,120 Z"/>',
    notch: '<path d="M0,120 L0,56 L640,56 L720,104 L800,56 L1440,56 L1440,120 Z"/>',
  };
  return `<div aria-hidden="true" style="position:relative;line-height:0;margin-top:-1px"><svg viewBox="0 0 1440 120" preserveAspectRatio="none" style="display:block;width:100%;height:clamp(40px,6vw,90px);fill:${fill}">${shapes[variant]}</svg></div>`;
}

/** Faint dot field for texture behind content. Purely decorative. */
export function dotField(color: string, opacity = 0.14): string {
  return `<div aria-hidden="true" style="position:absolute;inset:0;opacity:${opacity};background-image:radial-gradient(${color} 1px,transparent 1px);background-size:22px 22px"></div>`;
}

/** Oversized outline word behind a heading. */
export function outlineWord(word: string, theme: PreviewTheme): string {
  return `<div aria-hidden="true" style="position:absolute;top:-18px;left:-6px;font-family:'${theme.fHead}',serif;font-size:clamp(70px,13vw,170px);font-weight:800;line-height:.8;letter-spacing:-.03em;color:transparent;-webkit-text-stroke:1px ${theme.secondary}38;pointer-events:none;white-space:nowrap">${word}</div>`;
}

export function eyebrow(text: string, theme: PreviewTheme): string {
  return `<p style="font-size:12px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;color:${theme.secondary};margin-bottom:12px">${text}</p>`;
}

export function heading(text: string, theme: PreviewTheme, p: Palette, align = 'left'): string {
  return `<h2 style="font-family:'${theme.fHead}',serif;font-size:clamp(26px,4vw,42px);font-weight:700;line-height:1.12;color:${p.txt};text-align:${align};max-width:20ch;${align === 'center' ? 'margin-left:auto;margin-right:auto;' : ''}">${text}</h2>`;
}

// --------------------------------------------------------------------------
// Content sections
// --------------------------------------------------------------------------

const ICONS = [
  '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M12 22V12M3 7l9 5 9-5"/>',
  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  '<path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 3v6h6"/>',
  '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  '<path d="M12 3l2.6 5.6 6.4.8-4.7 4.3 1.3 6.3-5.6-3.1-5.6 3.1 1.3-6.3L3 9.4l6.4-.8z"/>',
  '<path d="M20 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
];

export function icon(index: number, color: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px">${ICONS[index % ICONS.length]}</svg>`;
}

/** Icon-led capability grid — the staple "why us" band of every theme demo. */
export function iconGrid(
  theme: PreviewTheme,
  p: Palette,
  title: string,
  items: Array<{ title: string; blurb: string }>,
  align: 'left' | 'center' = 'center'
): string {
  const cards = items
    .map(
      (item, index) => `<div class="card" style="position:relative;padding:30px 26px;background:${p.card};border:1px solid ${p.brd};border-radius:16px">
<div style="width:52px;height:52px;border-radius:13px;background:${theme.secondary}1a;display:flex;align-items:center;justify-content:center;margin-bottom:18px">${icon(index, theme.secondary)}</div>
<h3 style="font-family:'${theme.fHead}',serif;font-size:18px;font-weight:700;color:${p.txt};margin-bottom:9px">${item.title}</h3>
<p style="font-size:14.5px;line-height:1.7;color:${p.muted}">${item.blurb}</p>
</div>`
    )
    .join('');
  return `<section class="sp" style="position:relative;padding:96px 20px;background:${p.alt};overflow:hidden">
${dotField(theme.secondary, 0.1)}
<div class="ctn" style="position:relative">
<div style="margin-bottom:48px;${align === 'center' ? 'text-align:center' : ''}">${eyebrow('Why us', theme)}${heading(title, theme, p, align)}</div>
<div class="g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:26px">${cards}</div>
</div></section>`;
}

/** Numbered process timeline with an oversized index numeral per step. */
export function processTimeline(
  theme: PreviewTheme,
  p: Palette,
  title: string,
  steps: Array<{ title: string; blurb: string }>,
  align: 'left' | 'center' = 'left'
): string {
  const items = steps
    .map(
      (step, index) => `<div style="position:relative;padding-left:0">
<div style="font-family:'${theme.fHead}',serif;font-size:clamp(46px,7vw,74px);font-weight:800;line-height:.9;color:transparent;-webkit-text-stroke:1.4px ${theme.secondary}80;margin-bottom:14px">0${index + 1}</div>
<div style="height:2px;background:linear-gradient(to right,${theme.secondary},transparent);margin-bottom:18px"></div>
<h3 style="font-family:'${theme.fHead}',serif;font-size:19px;font-weight:700;color:${p.txt};margin-bottom:9px">${step.title}</h3>
<p style="font-size:14.5px;line-height:1.7;color:${p.muted}">${step.blurb}</p>
</div>`
    )
    .join('');
  return `<section class="sp" style="padding:96px 20px;background:${p.surface}">
<div class="ctn">
<div style="margin-bottom:48px;${align === 'center' ? 'text-align:center' : ''}">${eyebrow('How it works', theme)}${heading(title, theme, p, align)}</div>
<div class="g3" style="display:grid;grid-template-columns:repeat(${Math.min(steps.length, 4)},1fr);gap:36px">${items}</div>
</div></section>`;
}

/** Full-bleed photographic band with a floating glass quote card over it. */
export function quoteBand(
  theme: PreviewTheme,
  image: string,
  quote: { text: string; name: string; role: string }
): string {
  return `<section style="position:relative;padding:120px 20px;overflow:hidden">
<img src="${image}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"/>
<div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(9,9,11,.86),rgba(9,9,11,.5))"></div>
<div class="ctn" style="position:relative">
<div style="max-width:760px;padding:40px 38px;background:rgba(255,255,255,.07);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.16);border-radius:20px">
<div style="font-family:'${theme.fHead}',serif;font-size:56px;line-height:.6;color:${theme.secondary};margin-bottom:14px">&ldquo;</div>
<p style="font-family:'${theme.fHead}',serif;font-size:clamp(19px,2.6vw,27px);line-height:1.5;color:#fff;margin-bottom:22px">${quote.text}</p>
<div style="display:flex;align-items:center;gap:12px">
<div style="width:34px;height:2px;background:${theme.secondary}"></div>
<div><div style="font-size:14px;font-weight:700;color:#fff">${quote.name}</div><div style="font-size:12.5px;color:rgba(255,255,255,.65)">${quote.role}</div></div>
</div></div></div></section>`;
}

/** Two testimonial cards, offset so the row is not a symmetrical pair. */
export function testimonialPair(
  theme: PreviewTheme,
  p: Palette,
  items: Array<{ text: string; name: string; role: string }>,
  align: 'left' | 'center' = 'left'
): string {
  const cards = items
    .map(
      (item, index) => `<figure class="card" style="margin:0;padding:32px 30px;background:${p.card};border:1px solid ${p.brd};border-radius:18px;${index === 1 ? 'margin-top:36px' : ''}">
<div style="font-family:'${theme.fHead}',serif;font-size:44px;line-height:.6;color:${theme.secondary}66;margin-bottom:16px">&ldquo;</div>
<blockquote style="font-size:16px;line-height:1.75;color:${p.txt};margin:0 0 20px">${item.text}</blockquote>
<figcaption style="font-size:13px;color:${p.muted}"><span style="font-weight:700;color:${p.txt}">${item.name}</span> · ${item.role}</figcaption>
</figure>`
    )
    .join('');
  return `<section class="sp" style="padding:96px 20px;background:${p.alt}">
<div class="ctn">
<div style="margin-bottom:44px;${align === 'center' ? 'text-align:center' : ''}">${eyebrow('In their words', theme)}${heading('What clients say afterwards', theme, p, align)}</div>
<div class="g2" style="display:grid;grid-template-columns:1fr 1fr;gap:26px;align-items:start">${cards}</div>
</div></section>`;
}

/** Infinite keyword marquee — pure CSS, duplicated once for a seamless loop. */
export function marquee(theme: PreviewTheme, words: string[]): string {
  const row = words
    .map(
      (word) =>
        `<span style="display:inline-flex;align-items:center;gap:26px;font-family:'${theme.fHead}',serif;font-size:clamp(20px,3vw,34px);font-weight:700;color:rgba(255,255,255,.92);white-space:nowrap">${word}<span style="width:9px;height:9px;border-radius:50%;background:${theme.secondary};display:inline-block"></span></span>`
    )
    .join('');
  return `<section aria-hidden="true" style="padding:26px 0;background:${theme.primary};overflow:hidden">
<div style="display:flex;width:max-content;gap:26px;animation:slide 26s linear infinite">${row}${row}</div>
</section>`;
}

/** Stat band with oversized numerals and hairline separators. */
export function statBand(
  theme: PreviewTheme,
  p: Palette,
  stats: Array<{ value: string; label: string }>
): string {
  const items = stats
    .map(
      (stat, index) => `<div class="sb" style="text-align:center;padding:0 18px;${index > 0 ? `border-left:1px solid ${p.brd}` : ''}">
<div style="font-family:'${theme.fHead}',serif;font-size:clamp(34px,5vw,58px);font-weight:800;line-height:1;color:${theme.secondary}">${stat.value}</div>
<div style="margin-top:10px;font-size:12.5px;letter-spacing:1.4px;text-transform:uppercase;color:${p.muted}">${stat.label}</div>
</div>`
    )
    .join('');
  return `<section class="sp" style="padding:70px 20px;background:${p.surface};border-top:1px solid ${p.brd};border-bottom:1px solid ${p.brd}">
<div class="ctn g3" style="display:grid;grid-template-columns:repeat(${stats.length},1fr);gap:30px">${items}</div>
</section>`;
}

/** FAQ accordion built on <details> so it works with JavaScript disabled. */
export function faqAccordion(
  theme: PreviewTheme,
  p: Palette,
  faqs: Array<{ q: string; a: string }>
): string {
  const items = faqs
    .map(
      (faq, index) => `<details ${index === 0 ? 'open' : ''} style="border-bottom:1px solid ${p.brd};padding:20px 0">
<summary style="cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:20px;font-family:'${theme.fHead}',serif;font-size:17px;font-weight:700;color:${p.txt}">${faq.q}<span style="color:${theme.secondary};font-size:22px;line-height:1">+</span></summary>
<p style="margin-top:14px;font-size:15px;line-height:1.75;color:${p.muted};max-width:70ch">${faq.a}</p>
</details>`
    )
    .join('');
  return `<section class="sp" style="padding:96px 20px;background:${p.surface}">
<div class="ctn g2" style="display:grid;grid-template-columns:.8fr 1.2fr;gap:52px;align-items:start">
<div>${eyebrow('Questions', theme)}${heading('Answered before you ask', theme, p)}</div>
<div>${items}</div>
</div></section>`;
}

/** Image with an offset brand-colour block behind it — cheap, effective depth. */
export function offsetImage(theme: PreviewTheme, image: string, alt: string, height = 440): string {
  return `<div style="position:relative;padding:0 18px 18px 0">
<div aria-hidden="true" style="position:absolute;right:0;bottom:0;width:72%;height:78%;background:${theme.secondary}2e;border-radius:16px"></div>
<div style="position:relative;overflow:hidden;border-radius:16px"><img src="${image}" alt="${alt}" style="width:100%;height:${height}px;object-fit:cover;display:block"/></div>
</div>`;
}

/** Masonry-ish gallery: one tall frame beside a stack of two. */
export function galleryMosaic(theme: PreviewTheme, p: Palette, images: string[], title: string, align: 'left' | 'center' = 'left'): string {
  const [a, b, c] = [images[0], images[1], images[2]];
  if (!a) return '';
  return `<section class="sp" style="padding:96px 20px;background:${p.alt}">
<div class="ctn">
<div style="position:relative;margin-bottom:44px;${align === 'center' ? 'text-align:center' : ''}">${align === 'center' ? '' : outlineWord('Gallery', theme)}<div style="position:relative">${eyebrow('Recent work', theme)}${heading(title, theme, p, align)}</div></div>
<div class="g2" style="display:grid;grid-template-columns:1.25fr .75fr;gap:20px">
<div style="overflow:hidden;border-radius:16px"><img src="${a}" alt="" style="width:100%;height:100%;min-height:380px;object-fit:cover;display:block"/></div>
<div style="display:grid;gap:20px">
${b ? `<div style="overflow:hidden;border-radius:16px"><img src="${b}" alt="" style="width:100%;height:180px;object-fit:cover;display:block"/></div>` : ''}
${c ? `<div style="overflow:hidden;border-radius:16px"><img src="${c}" alt="" style="width:100%;height:180px;object-fit:cover;display:block"/></div>` : ''}
</div></div></div></section>`;
}

/** Closing CTA on a brand field with a dot texture and a single action. */
export function ctaBand(theme: PreviewTheme, href: string, headingText: string, sub: string): string {
  return `<section style="position:relative;padding:104px 20px;background:linear-gradient(135deg,${theme.primary},${theme.primary}f0);text-align:center;overflow:hidden">
${dotField('#ffffff', 0.12)}
<div style="position:relative;max-width:660px;margin:0 auto">
<h2 style="font-family:'${theme.fHead}',serif;font-size:clamp(28px,4.4vw,44px);font-weight:700;color:#fff;margin-bottom:16px;line-height:1.15">${headingText}</h2>
<p style="font-size:16.5px;line-height:1.7;color:rgba(255,255,255,.82);margin-bottom:32px">${sub}</p>
<a href="${href}" style="padding:16px 42px;background:${theme.secondary};color:#fff;border-radius:9px;font-weight:700;font-size:15.5px;display:inline-block;box-shadow:0 10px 34px rgba(0,0,0,.28)">${theme.cta}</a>
</div></section>`;
}

/** Extra keyframes the sections above rely on, appended to the page CSS. */
export const SECTION_CSS = `@keyframes slide{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes kb{from{transform:scale(1)}to{transform:scale(1.08)}}
.card:hover img{filter:grayscale(0)}
details summary::-webkit-details-marker{display:none}
details[open] summary span{transform:rotate(45deg)}
details summary span{display:inline-block;transition:transform .25s}
@media(max-width:768px){.g2,.g3{grid-template-columns:1fr!important}.sb{border-left:0!important;padding:0!important}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}`;

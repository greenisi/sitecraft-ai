import type { DesignSystem, GenerationConfig } from '@/types/project';
import type { DesignVariety } from './design-variety';

/**
 * The color contract answers, deterministically and per build, the questions
 * the model otherwise improvises its way into a white-and-gray template:
 *
 *   - which surface each section sits on (and how many are dark),
 *   - which exact class strings carry the brand at each role,
 *   - what the measurable floor for brand expression is.
 *
 * The system prompt can only say "express the brand color". This says
 * "section 4 is a primary-900 band, the eyebrow is text-accent-600, the hero
 * H1 is text-white over a scrim" — a plan the model executes rather than
 * invents. Same lesson as the divider/image guards: specifics land, vibes don't.
 */

export type SurfaceRole =
  | 'photo-scrim'
  | 'paper'
  | 'tinted'
  | 'brand-deep'
  | 'ink'
  | 'accent-band';

export interface SurfaceStep {
  role: SurfaceRole;
  surfaceClass: string;
  textClass: string;
  note: string;
}

export interface ColorContract {
  schemeName: string;
  schemeIntent: string;
  rhythm: SurfaceStep[];
  tokens: {
    displayHeading: string;
    bodyText: string;
    mutedText: string;
    eyebrow: string;
    primaryCta: string;
    secondaryCta: string;
    hairline: string;
    heroScrim: string;
    brandGradient: string;
    onDarkHeading: string;
    onDarkBody: string;
    numeral: string;
  };
  floor: string[];
  forbidden: string[];
}

const SURFACE_LIBRARY: Record<SurfaceRole, Omit<SurfaceStep, 'note'>> = {
  'photo-scrim': {
    role: 'photo-scrim',
    surfaceClass: 'relative overflow-hidden (full-bleed <img> + gradient scrim)',
    textClass: 'text-white',
  },
  paper: {
    role: 'paper',
    surfaceClass: 'bg-white',
    textClass: 'text-neutral-900',
  },
  tinted: {
    role: 'tinted',
    surfaceClass: 'bg-primary-50',
    textClass: 'text-neutral-900',
  },
  'brand-deep': {
    role: 'brand-deep',
    surfaceClass: 'bg-primary-900',
    textClass: 'text-white',
  },
  ink: {
    role: 'ink',
    surfaceClass: 'bg-neutral-950',
    textClass: 'text-white',
  },
  'accent-band': {
    role: 'accent-band',
    surfaceClass: 'bg-accent-600',
    textClass: 'text-white',
  },
};

interface SurfaceScheme {
  id: string;
  name: string;
  intent: string;
  /** Ordered surface roles for the homepage, cycled if the page runs longer. */
  sequence: SurfaceRole[];
  /** Positioning tiers this scheme is allowed to serve. */
  positioning: Array<'value' | 'considered' | 'premium'>;
}

const SURFACE_SCHEMES: SurfaceScheme[] = [
  {
    id: 'dark-anchored',
    name: 'Dark-anchored',
    intent:
      'A cinematic photographic opening, a calm light middle, and two deep brand bands that anchor proof and conversion. Drama at the ends, clarity in the centre.',
    sequence: [
      'photo-scrim',
      'paper',
      'tinted',
      'brand-deep',
      'paper',
      'photo-scrim',
      'paper',
      'ink',
      'paper',
      'brand-deep',
    ],
    positioning: ['considered', 'premium'],
  },
  {
    id: 'tinted-editorial',
    name: 'Tinted editorial',
    intent:
      'The page reads as printed paper: a warm tinted base carries most sections, white is used as the accent surface (not the default), and one deep band supplies the single hard contrast moment.',
    sequence: [
      'photo-scrim',
      'tinted',
      'paper',
      'tinted',
      'brand-deep',
      'tinted',
      'photo-scrim',
      'paper',
      'tinted',
      'ink',
    ],
    positioning: ['premium', 'considered'],
  },
  {
    id: 'contrast-bands',
    name: 'Contrast bands',
    intent:
      'Full-bleed alternation between near-black and paper, so scrolling feels like turning between chapters. Every dark band carries a single oversized idea.',
    sequence: [
      'ink',
      'paper',
      'ink',
      'tinted',
      'photo-scrim',
      'paper',
      'ink',
      'paper',
      'brand-deep',
      'paper',
    ],
    positioning: ['considered', 'premium'],
  },
  {
    id: 'saturated-brand',
    name: 'Saturated brand',
    intent:
      'The brand colour is the background, not the trim. Large saturated fields do the talking, white sections exist to let the eye rest.',
    sequence: [
      'photo-scrim',
      'paper',
      'brand-deep',
      'paper',
      'accent-band',
      'paper',
      'brand-deep',
      'tinted',
      'paper',
      'ink',
    ],
    positioning: ['value', 'considered'],
  },
];

const SECTION_NOTES: Record<SurfaceRole, string> = {
  'photo-scrim':
    'Photographic section. Layer an absolutely-positioned <img> under a gradient scrim; all copy is white and sits above the scrim.',
  paper: 'Light section. Dark type, generous whitespace — this is where detail and proof live.',
  tinted:
    'Tinted section. The brand tint is the surface itself, NOT a card sitting on white. Cards inside this section go white so they lift off the tint. Where a page carries two tinted sections, make the second bg-secondary-50 so more than one hue of the palette shows.',
  'brand-deep':
    'Deep brand section. Full-bleed brand colour, white type, one oversized idea — statement, stat, or conversion. Never a plain card grid.',
  ink: 'Ink section. Near-black full-bleed field for the highest-contrast moment on the page: display type, portfolio, or the closing CTA.',
  'accent-band':
    'Accent band. Short, loud, and single-purpose — one line plus one action. Never used for body content.',
};

function hash(input: string): number {
  let result = 0;
  for (let index = 0; index < input.length; index += 1) {
    result = ((result << 5) - result + input.charCodeAt(index)) | 0;
  }
  return Math.abs(result);
}

function buildRhythm(scheme: SurfaceScheme, sectionCount: number): SurfaceStep[] {
  const steps: SurfaceStep[] = [];
  // Section 1 is the hero. Its STRUCTURE comes from the assigned hero template
  // (photographic Pattern A, asymmetric Pattern B, etc.); the surface here only
  // says which colour field that template sits on.
  for (let index = 0; index < sectionCount; index += 1) {
    const role = scheme.sequence[index % scheme.sequence.length];
    const previous = steps[steps.length - 1];
    // Cycling a sequence can repeat a role across the seam; nudge to the next
    // distinct role so no two adjacent sections ever share a surface.
    const resolved =
      previous && previous.role === role
        ? scheme.sequence[(index + 1) % scheme.sequence.length]
        : role;
    steps.push({ ...SURFACE_LIBRARY[resolved], note: SECTION_NOTES[resolved] });
  }
  return steps;
}

/**
 * Builds the per-build colour plan. Deterministic: the same business always
 * gets the same scheme, and two different businesses in the same industry get
 * different ones.
 */
export function createColorContract(
  config: GenerationConfig,
  designSystem: DesignSystem,
  variety: DesignVariety,
  positioning: 'value' | 'considered' | 'premium',
  sectionCount = 12
): ColorContract {
  const seed = hash(
    `${config.business.name}:${config.business.description}:${variety.matchedIndustry}:color`
  );
  const eligible = SURFACE_SCHEMES.filter((scheme) =>
    scheme.positioning.includes(positioning)
  );
  const pool = eligible.length > 0 ? eligible : SURFACE_SCHEMES;
  const scheme = pool[seed % pool.length];

  // Bold verticals put the brand colour in the headline; restrained ones keep
  // headings neutral and let the eyebrow and CTA carry it. Either way the
  // decision is made here rather than left to the model's default (gray-900).
  const boldHeadings = /creative|fitness|restaurant|beauty|automotive|events/.test(
    variety.matchedIndustry
  );

  return {
    schemeName: scheme.name,
    schemeIntent: scheme.intent,
    rhythm: buildRhythm(scheme, sectionCount),
    tokens: {
      displayHeading: boldHeadings ? 'text-primary-900' : 'text-neutral-900',
      bodyText: 'text-neutral-700',
      mutedText: 'text-neutral-600',
      eyebrow: 'text-accent-600 text-xs font-semibold uppercase tracking-[0.2em]',
      primaryCta:
        'bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-200',
      secondaryCta:
        'border border-primary-600 text-primary-700 hover:bg-primary-50 transition-colors duration-200',
      hairline: 'border-neutral-200',
      heroScrim: 'bg-gradient-to-t from-neutral-950/80 via-neutral-950/40 to-transparent',
      brandGradient: `bg-gradient-to-br from-primary-700 via-primary-800 to-neutral-950 (hexes: ${designSystem.colors.primary['700']} → ${designSystem.colors.primary['800']} → ${designSystem.colors.neutral['950']})`,
      onDarkHeading: 'text-white',
      onDarkBody: 'text-white/80',
      numeral: 'text-accent-500',
    },
    floor: [
      'The first viewport must contain the brand colour in at least TWO places that are not the same element (e.g. eyebrow + CTA, or a brand-tinted scrim + CTA).',
      'At least THREE homepage sections must be non-light surfaces (photo-scrim / brand-deep / ink / accent-band). A homepage where every section is white or gray fails.',
      'The accent colour appears at least three times across the homepage — on eyebrows, numerals, underlines, or quote marks — and NEVER as body copy.',
      'Every interior page repeats the same scheme: at least one non-light surface per page, and the same eyebrow/CTA token strings as the homepage.',
      'Use text-neutral-* and bg-neutral-* throughout. text-gray-* / bg-gray-* are forbidden — they discard the palette\'s warmth or coolness.',
    ],
    forbidden: [
      'A homepage whose sections are all bg-white / bg-gray-50 with one coloured button.',
      'Brand colour used only as a button fill.',
      'Rainbow or multi-hue gradients. Gradients stay inside one hue family plus neutral.',
      'Tinted sections rendered as a coloured card floating on a white section — the tint must be the full-bleed surface.',
      'Mid shades (400/500) as section backgrounds; they are for accents, marks, and numerals only.',
    ],
  };
}

export function formatColorContract(contract: ColorContract): string {
  const rhythm = contract.rhythm
    .map(
      (step, index) =>
        `${index + 1}. ${step.role} — surface: ${step.surfaceClass}; type: ${step.textClass}\n   ${step.note}`
    )
    .join('\n');

  return `=== COLOR CONTRACT — THIS IS THE PLAN, NOT A SUGGESTION ===
Scheme: ${contract.schemeName}
Intent: ${contract.schemeIntent}

SURFACE RHYTHM (homepage, in order — interior pages reuse the same vocabulary in a different order):
${rhythm}
Section 1 is the hero: its STRUCTURE comes from the hero pattern you were assigned, and the surface above only tells you which colour field that pattern sits on (photo-scrim = full-bleed photograph, ink = display type over near-black).
If the homepage has more sections than listed, continue the pattern; never place two identical surfaces back to back.

EXACT TOKENS — copy these class strings rather than inventing colour choices:
- Display headings (light surfaces): ${contract.tokens.displayHeading}
- Body copy: ${contract.tokens.bodyText}
- Secondary/muted copy: ${contract.tokens.mutedText}
- Eyebrow / kicker: ${contract.tokens.eyebrow}
- Primary CTA: ${contract.tokens.primaryCta}
- Secondary CTA: ${contract.tokens.secondaryCta}
- Hairlines and dividers: ${contract.tokens.hairline}
- Hero / photo scrim: ${contract.tokens.heroScrim}
- Brand gradient (dark bands only): ${contract.tokens.brandGradient}
- Headings on dark surfaces: ${contract.tokens.onDarkHeading}
- Body on dark surfaces: ${contract.tokens.onDarkBody}
- Stat numerals and section numbers: ${contract.tokens.numeral}

BRAND EXPRESSION FLOOR — each of these is checkable, so meet all of them:
${contract.floor.map((rule) => `- ${rule}`).join('\n')}

FORBIDDEN IN THIS BUILD:
${contract.forbidden.map((rule) => `- ${rule}`).join('\n')}

Contrast still governs: light surface → dark type, dark surface → white type. The
rhythm above already pairs them correctly; keep the pairing when you adapt it.`;
}

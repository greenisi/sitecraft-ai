import type { GenerationConfig } from '@/types/project';
import type { DesignVariety } from './design-variety';

/**
 * The motion contract exists because a menu of options produces the same two
 * choices every time: fade-up plus a hover lift. The system prompt offers four
 * signature devices; the model reliably ships zero of them unless one is named
 * as the requirement for THIS build.
 *
 * So this picks — deterministically, per business — one motion personality,
 * one required signature device, and the exact entrance utility for each
 * content role. The model executes a spec instead of choosing from a buffet.
 */

export interface MotionContract {
  personality: string;
  intent: string;
  heroEntrance: string;
  entrances: {
    sectionHeading: string;
    bodyRows: string;
    imagery: string;
    numerals: string;
  };
  staggerMs: number;
  durationRange: string;
  signatureDevice: { id: string; name: string; brief: string };
  ambient: string;
  hoverLanguage: string;
  forbidden: string[];
}

interface MotionPersonality {
  id: string;
  name: string;
  intent: string;
  heroEntrance: string;
  entrances: MotionContract['entrances'];
  staggerMs: number;
  durationRange: string;
  ambient: string;
  hoverLanguage: string;
  positioning: Array<'value' | 'considered' | 'premium'>;
}

const PERSONALITIES: MotionPersonality[] = [
  {
    id: 'editorial-calm',
    name: 'Editorial calm',
    intent:
      'Motion behaves like a well-set magazine: type sharpens into place, photography drifts, nothing bounces. Restraint reads as expensive.',
    heroEntrance: 'animate-blur-in on the display line, animate-fade-in on the supporting copy',
    entrances: {
      sectionHeading: 'animate-blur-in',
      bodyRows: 'animate-fade-in-up',
      imagery: 'animate-scale-in',
      numerals: 'animate-fade-in',
    },
    staggerMs: 120,
    durationRange: '700–900ms for section reveals, 200–300ms for interaction feedback',
    ambient: 'animate-kenburns on exactly one hero or interlude photograph',
    hoverLanguage:
      'Cards: hairline darkens and the image inside scales to 1.03 — no lift. Buttons: background shifts over 200ms.',
    positioning: ['premium', 'considered'],
  },
  {
    id: 'kinetic-bold',
    name: 'Kinetic bold',
    intent:
      'Content arrives with intent from alternating directions, numerals punch in, and one band keeps moving. Energy without novelty effects.',
    heroEntrance: 'animate-rise-in on the headline, animate-fade-in-up on the CTA row',
    entrances: {
      sectionHeading: 'animate-fade-in-down',
      bodyRows: 'animate-slide-in-left on odd rows, animate-slide-in-right on even rows',
      imagery: 'animate-fade-in-up',
      numerals: 'animate-scale-in',
    },
    staggerMs: 90,
    durationRange: '500–700ms for section reveals, 200ms for interaction feedback',
    ambient: 'animate-gradient-shift on one dark band (pair with bg-[length:200%_200%])',
    hoverLanguage:
      'Cards: -translate-y-1, shadow deepens, border takes the accent colour — all three together over 300ms. Buttons: shimmer sweep on the primary CTA only.',
    positioning: ['value', 'considered'],
  },
  {
    id: 'cinematic-slow',
    name: 'Cinematic slow',
    intent:
      'The page moves like a camera: long dissolves, photography that drifts against the scroll, one sequence that holds the viewport.',
    heroEntrance: 'animate-fade-in on the scrim layer, animate-rise-in on the headline',
    entrances: {
      sectionHeading: 'animate-fade-in-up',
      bodyRows: 'animate-fade-in',
      imagery: 'animate-blur-in',
      numerals: 'animate-fade-in-up',
    },
    staggerMs: 150,
    durationRange: '900–1100ms for section reveals, 250–300ms for interaction feedback',
    ambient: 'animate-kenburns on the hero photograph',
    hoverLanguage:
      'Cards: the image inside scales to 1.05 inside overflow-hidden while a caption fades up. Buttons: 250ms colour shift, no movement.',
    positioning: ['premium', 'considered'],
  },
  {
    id: 'crisp-utility',
    name: 'Crisp utility',
    intent:
      'Fast, legible, no ceremony — motion confirms the page is responsive and then gets out of the way. Suits urgency-driven trades.',
    heroEntrance: 'animate-fade-in-up on the headline and CTA together',
    entrances: {
      sectionHeading: 'animate-fade-in-up',
      bodyRows: 'animate-fade-in',
      imagery: 'animate-slide-in-right',
      numerals: 'animate-scale-in',
    },
    staggerMs: 70,
    durationRange: '400–600ms for section reveals, 150–200ms for interaction feedback',
    ambient: 'animate-marquee on a single service/keyword strip',
    hoverLanguage:
      'Cards: shadow deepens and the border takes the primary colour over 200ms. Buttons: instant-feeling 150ms colour shift.',
    positioning: ['value', 'considered'],
  },
];

interface SignatureDevice {
  id: string;
  name: string;
  brief: string;
  /** Industries this device suits; empty means it suits any. */
  industries: string[];
}

const SIGNATURE_DEVICES: SignatureDevice[] = [
  {
    id: 'sticky-chapters',
    name: 'Sticky stacked chapters',
    brief:
      'Build the process/services section as full-height sticky panels that slide over one another on scroll, each with its own photograph, oversized index numeral, and one line of copy. Pure CSS sticky — see the SIGNATURE DYNAMICS template.',
    industries: [],
  },
  {
    id: 'snap-gallery',
    name: 'Horizontal snap gallery',
    brief:
      'Build the portfolio/projects/menu section as a horizontally scrolling snap rail that bleeds off the right edge of the viewport, with captions under each frame. See the SIGNATURE DYNAMICS template.',
    industries: ['landscaping', 'creative', 'realestate', 'restaurant', 'automotive', 'beauty'],
  },
  {
    id: 'parallax-interlude',
    name: 'Mid-page parallax interlude',
    brief:
      'Place a full-bleed photographic interlude between two content sections, with a single pull-quote or claim over it. Give the backdrop <img> data-parallax so the deterministic runtime drifts it against the scroll, and let one decorative layer counter-drift.',
    industries: [],
  },
  {
    id: 'marquee-band',
    name: 'Moving keyword band',
    brief:
      'Place a full-width marquee strip between two sections carrying service names, neighbourhoods, or materials in oversized type. Duplicate the content array exactly twice inside a flex w-max wrapper so the loop is seamless.',
    industries: ['fitness', 'automotive', 'events', 'creative', 'restaurant', 'landscaping'],
  },
];

function hash(input: string): number {
  let result = 0;
  for (let index = 0; index < input.length; index += 1) {
    result = ((result << 5) - result + input.charCodeAt(index)) | 0;
  }
  return Math.abs(result);
}

export function createMotionContract(
  config: GenerationConfig,
  variety: DesignVariety,
  positioning: 'value' | 'considered' | 'premium'
): MotionContract {
  const base = `${config.business.name}:${config.business.description}:${variety.matchedIndustry}`;
  const eligible = PERSONALITIES.filter((entry) => entry.positioning.includes(positioning));
  const pool = eligible.length > 0 ? eligible : PERSONALITIES;
  const personality = pool[hash(`${base}:motion`) % pool.length];

  const deviceMatches = SIGNATURE_DEVICES.filter(
    (device) => device.industries.length === 0 || device.industries.includes(variety.matchedIndustry)
  );
  const devicePool = deviceMatches.length > 0 ? deviceMatches : SIGNATURE_DEVICES;
  const device = devicePool[hash(`${base}:device`) % devicePool.length];

  return {
    personality: personality.name,
    intent: personality.intent,
    heroEntrance: personality.heroEntrance,
    entrances: personality.entrances,
    staggerMs: personality.staggerMs,
    durationRange: personality.durationRange,
    signatureDevice: { id: device.id, name: device.name, brief: device.brief },
    ambient: personality.ambient,
    hoverLanguage: personality.hoverLanguage,
    forbidden: [
      'Every section entering with the same utility — the four roles above use distinct entrances by design.',
      'More than one ambient looping animation on the page (the one named above is the whole budget).',
      'Arbitrary animate-[...] values — they emit no keyframes and leave content invisible.',
      'Hand-written IntersectionObserver gating that starts content at opacity-0 without a failsafe. Use the fail-open useReveal hook.',
      'Animation libraries (framer-motion, GSAP, AOS). CSS and the named utility kit only.',
    ],
  };
}

export function formatMotionContract(contract: MotionContract): string {
  return `=== MOTION CONTRACT — ONE PERSONALITY, ONE REQUIRED DEVICE ===
Motion personality: ${contract.personality}
Intent: ${contract.intent}

ENTRANCE ASSIGNMENTS — four distinct utilities, one per content role. Do not collapse them into one:
- Hero: ${contract.heroEntrance}
- Section headings: ${contract.entrances.sectionHeading}
- Body/content rows: ${contract.entrances.bodyRows}
- Imagery: ${contract.entrances.imagery}
- Stat numerals: ${contract.entrances.numerals}

Stagger: ${contract.staggerMs}ms between siblings, cleared once the reveal finishes.
Durations: ${contract.durationRange}
Ambient loop (exactly one on the page): ${contract.ambient}
Hover language: ${contract.hoverLanguage}

REQUIRED SIGNATURE DEVICE — this build ships "${contract.signatureDevice.name}". It is
not optional and not interchangeable; a page without it is incomplete:
${contract.signatureDevice.brief}

FORBIDDEN IN THIS BUILD:
${contract.forbidden.map((rule) => `- ${rule}`).join('\n')}

Fail-open always: every animated element is fully visible and readable with
JavaScript disabled and under prefers-reduced-motion. Motion is added on top of
a working page, never the thing that makes content appear.`;
}

/**
 * Per-template design and motion variety.
 *
 * The interior pages were composed from one fixed section order, so all eight
 * templates shipped the identical rhythm — header, rows, marquee, icon grid,
 * quote, timeline, stats, FAQ, CTA — and `enliven` applied one identical motion
 * pattern on top. Different photography and colour cannot hide a shared
 * skeleton; that sameness is exactly what reads as "AI template".
 *
 * So each template gets its own section order per page, chosen to suit how that
 * business actually persuades (a law firm leads with method, a restaurant leads
 * with photography), plus its own motion personality. Assignments are explicit
 * rather than hashed so no two templates can collide.
 */

export type SectionKey =
  | 'rows'
  | 'story'
  | 'details'
  | 'booking'
  | 'marquee'
  | 'iconGrid'
  | 'quote'
  | 'timeline'
  | 'stats'
  | 'faq'
  | 'testimonials'
  | 'gallery'
  | 'team';

export interface MotionProfile {
  /** Milliseconds between staggered siblings. */
  stagger: number;
  /** Entrance styles cycled across elements ('' = rise from below). */
  reveals: string[];
  /** Drift rate for full-bleed backdrops. */
  backdrop: number;
  /** Drift rate for in-flow content photography. */
  content: number;
  /** Shape divider variants cycled between colour changes. */
  dividers: Array<'wave' | 'curve' | 'skew' | 'notch'>;
  /** Whether section headings centre or stay left on this template. */
  headingAlign: 'left' | 'center';
}

const MOTION: Record<string, MotionProfile> = {
  // Precise and quick — a developer tool should feel responsive, not theatrical.
  precise: {
    stagger: 55, reveals: ['right', '', 'left'], backdrop: 0.18, content: 0.07,
    dividers: ['skew'], headingAlign: 'center',
  },
  // Slow and even, the way an estate agent walks you through a house.
  measured: {
    stagger: 135, reveals: ['', 'scale', ''], backdrop: 0.26, content: 0.1,
    dividers: ['wave', 'curve'], headingAlign: 'left',
  },
  // Fast, alternating, physical.
  driving: {
    stagger: 70, reveals: ['left', 'right', 'scale'], backdrop: 0.48, content: 0.19,
    dividers: ['notch', 'skew'], headingAlign: 'left',
  },
  // Long dissolves and heavy drift, like a camera moving through a room.
  filmic: {
    stagger: 175, reveals: ['', '', 'scale'], backdrop: 0.56, content: 0.22,
    dividers: ['curve'], headingAlign: 'center',
  },
  // Confident mid-tempo with a sideways lead-in.
  assured: {
    stagger: 95, reveals: ['left', '', 'scale'], backdrop: 0.36, content: 0.14,
    dividers: ['skew', 'wave'], headingAlign: 'left',
  },
  // Gentle and unhurried — clinical calm without feeling sluggish.
  clinical: {
    stagger: 115, reveals: ['', 'left', ''], backdrop: 0.22, content: 0.09,
    dividers: ['curve', 'notch'], headingAlign: 'center',
  },
  // Quiet drift, minimal entrance vocabulary, product does the talking.
  editorial: {
    stagger: 150, reveals: ['scale', '', ''], backdrop: 0.44, content: 0.16,
    dividers: ['wave'], headingAlign: 'center',
  },
  // Deliberate and squared-off.
  formal: {
    stagger: 80, reveals: ['right', 'scale', ''], backdrop: 0.16, content: 0.06,
    dividers: ['notch'], headingAlign: 'left',
  },
};

export interface VarietyProfile {
  services: SectionKey[];
  about: SectionKey[];
  contact: SectionKey[];
  motion: MotionProfile;
}

/**
 * Section orders are per-business, not shuffled for the sake of it: a gym
 * front-loads energy and social proof, a law firm front-loads method and
 * answers, a shop leads with product photography.
 */
const PROFILES: Record<string, VarietyProfile> = {
  'obsidian-saas': {
    services: ['rows', 'iconGrid', 'stats', 'timeline', 'faq', 'quote'],
    about: ['story', 'timeline', 'stats', 'team', 'quote', 'faq'],
    contact: ['details', 'booking', 'faq', 'iconGrid'],
    motion: MOTION.precise,
  },
  'ivory-realty': {
    services: ['rows', 'quote', 'gallery', 'stats', 'faq', 'testimonials'],
    about: ['story', 'stats', 'team', 'gallery', 'testimonials', 'timeline'],
    contact: ['details', 'booking', 'testimonials', 'faq'],
    motion: MOTION.measured,
  },
  'titan-fitness': {
    services: ['rows', 'marquee', 'timeline', 'testimonials', 'stats', 'iconGrid'],
    about: ['story', 'team', 'stats', 'marquee', 'quote', 'gallery'],
    contact: ['details', 'booking', 'marquee', 'testimonials'],
    motion: MOTION.driving,
  },
  'maison-restaurant': {
    services: ['rows', 'gallery', 'quote', 'marquee', 'faq', 'stats'],
    about: ['story', 'gallery', 'team', 'quote', 'stats', 'marquee'],
    contact: ['details', 'booking', 'gallery', 'faq'],
    motion: MOTION.filmic,
  },
  'nova-agency': {
    services: ['rows', 'timeline', 'gallery', 'testimonials', 'stats', 'faq'],
    about: ['story', 'team', 'timeline', 'stats', 'gallery', 'quote'],
    contact: ['details', 'booking', 'testimonials', 'iconGrid'],
    motion: MOTION.assured,
  },
  'meridian-health': {
    services: ['rows', 'iconGrid', 'faq', 'quote', 'stats', 'timeline'],
    about: ['story', 'team', 'iconGrid', 'stats', 'timeline', 'testimonials'],
    contact: ['details', 'booking', 'faq', 'quote'],
    motion: MOTION.clinical,
  },
  'luxe-ecommerce': {
    services: ['rows', 'gallery', 'marquee', 'iconGrid', 'testimonials', 'stats'],
    about: ['story', 'gallery', 'iconGrid', 'quote', 'stats', 'team'],
    contact: ['details', 'booking', 'gallery', 'testimonials'],
    motion: MOTION.editorial,
  },
  'axiom-law': {
    services: ['rows', 'iconGrid', 'timeline', 'faq', 'quote', 'stats'],
    about: ['story', 'timeline', 'team', 'stats', 'faq', 'marquee'],
    contact: ['details', 'booking', 'faq', 'timeline'],
    motion: MOTION.formal,
  },
};

const DEFAULT_PROFILE: VarietyProfile = {
  services: ['rows', 'iconGrid', 'quote', 'stats', 'faq'],
  about: ['story', 'stats', 'team', 'quote'],
  contact: ['details', 'booking', 'faq'],
  motion: MOTION.measured,
};

export function getVariety(templateId: string): VarietyProfile {
  return PROFILES[templateId] || DEFAULT_PROFILE;
}

/**
 * Per-build motion personality and interior-page rhythm for generated sites.
 *
 * The template previews taught this the hard way: eight sites with different
 * photography and palettes still read as one template, because every page used
 * the same section order and the same single motion pattern. Colour varies
 * already (design system + colour contract); rhythm did not.
 *
 * So each build draws a motion personality and a section-order rotation from a
 * hash of the business — deterministic, so a rebuild is stable, and salted per
 * dimension so two similar businesses do not land on the same combination.
 * This feeds DynamicsRuntime (which needs no model cooperation) and the
 * blueprint reorder below (which also needs none).
 */
import type { PageBlueprint } from '@/types/project';

export interface SiteMotion {
  name: string;
  /** Milliseconds between staggered siblings. */
  stagger: number;
  /** Entrance styles cycled across a section's children. */
  reveals: string[];
  /** Drift rate for in-flow content photography. */
  content: number;
}

const MOTIONS: SiteMotion[] = [
  { name: 'precise', stagger: 55, reveals: ['right', '', 'left'], content: 0.07 },
  { name: 'measured', stagger: 135, reveals: ['', 'scale', ''], content: 0.1 },
  { name: 'driving', stagger: 70, reveals: ['left', 'right', 'scale'], content: 0.19 },
  { name: 'filmic', stagger: 175, reveals: ['', '', 'scale'], content: 0.22 },
  { name: 'assured', stagger: 95, reveals: ['left', '', 'scale'], content: 0.14 },
  { name: 'clinical', stagger: 115, reveals: ['', 'left', ''], content: 0.09 },
  { name: 'editorial', stagger: 150, reveals: ['scale', '', ''], content: 0.16 },
  { name: 'formal', stagger: 80, reveals: ['right', 'scale', ''], content: 0.06 },
];

function hash(input: string): number {
  let result = 0;
  for (let index = 0; index < input.length; index += 1) {
    result = ((result << 5) - result + input.charCodeAt(index)) | 0;
  }
  return Math.abs(result);
}

export function pickSiteMotion(businessName: string, description: string): SiteMotion {
  return MOTIONS[hash(`${businessName}:${description}:motion`) % MOTIONS.length];
}

/**
 * Sections whose position is load-bearing and must not be shuffled: the hero
 * opens, the conversion block closes.
 */
const PINNED_FIRST = /hero|banner|masthead/i;
const PINNED_LAST = /cta|contact|booking|footer|newsletter|subscribe/i;

/**
 * Rotates the middle of each INTERIOR page's section order by a per-build
 * offset, so two sites built from the same blueprint shape do not scroll
 * identically. The homepage is left alone — its order is argued for by the art
 * direction contract, and rotating it would fight that.
 *
 * Structural only: no section is added, removed, or rewritten, so this cannot
 * invent content or break a page.
 */
export function varyInteriorRhythm(
  blueprint: PageBlueprint,
  businessName: string,
  description: string
): PageBlueprint {
  const offset = hash(`${businessName}:${description}:rhythm`);

  const pages = blueprint.pages.map((page, pageIndex) => {
    if (page.path === '/') return page;
    const sections = [...page.sections].sort((a, b) => a.order - b.order);
    if (sections.length < 4) return page;

    const head = sections.filter((s) => PINNED_FIRST.test(s.componentName));
    const tail = sections.filter(
      (s) => !PINNED_FIRST.test(s.componentName) && PINNED_LAST.test(s.componentName)
    );
    const middle = sections.filter(
      (s) => !PINNED_FIRST.test(s.componentName) && !PINNED_LAST.test(s.componentName)
    );
    if (middle.length < 3) return page;

    // A seeded shuffle rather than a rotation: rotating n sections yields only
    // n orders, so similar businesses collided constantly. Fisher-Yates driven
    // by the same hash keeps it deterministic while opening up n! orders.
    const rotated = [...middle];
    let seed = offset + pageIndex * 7919;
    for (let index = rotated.length - 1; index > 0; index -= 1) {
      // Math.imul keeps the multiply exact in 32 bits; a plain `*` here
      // overflows JS float precision and collapses different seeds onto the
      // same sequence, which is why distinct businesses were colliding.
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const swap = seed % (index + 1);
      [rotated[index], rotated[swap]] = [rotated[swap], rotated[index]];
    }

    return {
      ...page,
      sections: [...head, ...rotated, ...tail].map((section, order) => ({ ...section, order })),
    };
  });

  return { ...blueprint, pages };
}

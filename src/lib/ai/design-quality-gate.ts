import type { ArtDirectionContract } from './art-direction';

export interface DesignQualityReport {
  score: number;
  severe: boolean;
  issues: string[];
}

type GeneratedFile = { path: string; content: string };

const GENERIC_COPY = [
  /\bwelcome to (?:our|the) website\b/i,
  /\byour trusted partner\b/i,
  /\bcommitted to excellence\b/i,
  /\blorem ipsum\b/i,
];

/**
 * Concrete claims a site should never invent.
 *
 * Banning generic copy pushed the model toward specifics, and with nothing
 * true to be specific with it filled the gap itself: phone numbers on the
 * real local area code, street addresses, job-count statistics, licensing
 * badges and office email addresses, none of which were in the brief.
 *
 * A number a visitor might ring, an address they might drive to, or a
 * licensing claim they might rely on is worse invented than absent, so these
 * score harder than a dull heading does.
 *
 * Deliberately no literal examples here or in the system prompt. Naming the
 * exact fabricated values made the next build reproduce those very strings.
 */
function findFabrications(text: string, knownFacts: string): string[] {
  const known = knownFacts.toLowerCase();
  const found: string[] = [];
  const seen = new Set<string>();

  const flag = (what: string) => {
    if (seen.has(what)) return;
    seen.add(what);
    found.push(what);
  };

  // 555 numbers are never a real business line. Always wrong, never supplied.
  if (/\(?\d{3}\)?[-.\s]?555[-.\s]?\d{4}/.test(text)) {
    flag('placeholder 555 phone number presented as the business line');
  }

  // Any other phone number the owner never gave us.
  for (const match of text.matchAll(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g)) {
    const digits = match[0].replace(/\D/g, '');
    if (!known.replace(/\D/g, '').includes(digits)) {
      flag(`invented phone number "${match[0].trim()}"`);
      break;
    }
  }

  for (const match of text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) {
    if (!known.includes(match[0].toLowerCase())) {
      flag(`invented email address "${match[0]}"`);
      break;
    }
  }

  const address = text.match(
    /\b\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:Road|Rd|Street|St|Avenue|Ave|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/
  );
  if (address && !known.includes(address[0].toLowerCase())) {
    flag(`invented street address "${address[0]}"`);
  }

  // Fabricated proof: "212 Roofs", "500+ homes", "1,200 customers".
  for (const match of text.matchAll(
    /\b(\d{1,3}(?:,\d{3})*)\+?\s+(roofs|homes|customers|clients|projects|families|jobs|installs|properties)\b/gi
  )) {
    if (!known.includes(match[1].toLowerCase())) {
      flag(`invented statistic "${match[0].trim()}"`);
      break;
    }
  }

  // Licensing and insurance are claims a customer relies on legally.
  for (const claim of ['licensed', 'insured', 'bonded', 'certified']) {
    if (new RegExp(`\\b${claim}\\b`, 'i').test(text) && !known.includes(claim)) {
      flag(`unsupported "${claim}" claim`);
    }
  }

  return found;
}

/**
 * Heading formulas measured across 435 headings on twelve live generated
 * sites. These are not guesses about what might read as generated -- they are
 * what the generator actually produced, and the reason a visitor can tell.
 *
 * "Ready to ...?" alone appeared 18 times across 8 of 12 sites, and three of
 * those sites used the SAME one three or four times on a single site.
 *
 * The words differ every time; the formula does not, and the formula is what
 * gets recognised.
 */
const SLOP_HEADINGS: Array<[string, RegExp]> = [
  ['"Ready to ...?" CTA heading', /^ready to .+\?$/i],
  ['"What Our X Say" testimonial heading', /^what our .+\b(?:say|think)\b/i],
  ['"Our X Services" section heading', /^our\b.*\bservices?$/i],
  ['"Why Choose X" heading', /^why choose\b/i],
  ['"Get Started/In Touch" heading', /^(?:get started|get in touch)\b/i],
  ['"Transform Your X" heading', /\btransform your\b/i],
  ['"Experience the Difference" heading', /\bexperience the difference\b/i],
];

/**
 * Literal heading text, with JSX expressions dropped: an interpolated heading
 * is data-driven and cannot be judged from source.
 */
function literalHeadings(source: string): string[] {
  return [...source.matchAll(/<h[1-4][^>]*>([\s\S]{0,160}?)<\/h[1-4]>/gi)]
    .map((match) =>
      match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter((text) => text.length > 0 && !text.includes('{'));
}

/**
 * A deterministic post-generation gate. It deliberately scores only clear,
 * high-signal failure modes; subjective taste stays in the art-direction
 * contract and model prompt instead of becoming a brittle regex rule.
 */
export interface BuildExpectations {
  /** Signature device id named by the motion contract for this build. */
  requiredDeviceId?: string;
  /**
   * Everything the owner actually told us -- name, tagline, description.
   * A concrete claim on the site that appears nowhere in here was invented
   * by the model, not supplied by the business.
   */
  knownFacts?: string;
}

/** Source signatures for each signature device the motion contract can assign. */
const DEVICE_SIGNATURES: Record<string, RegExp> = {
  'sticky-chapters': /sticky\s+top-0[^"'`]*min-h-screen|min-h-screen[^"'`]*sticky\s+top-0/,
  'snap-gallery': /snap-x|snap-mandatory/,
  'parallax-interlude': /data-parallax/,
  'marquee-band': /animate-marquee/,
};

export function evaluateDesignQuality(
  files: GeneratedFile[],
  contract: ArtDirectionContract,
  expectations: BuildExpectations = {}
): DesignQualityReport {
  const source = files
    .filter((file) => /\.(tsx?|jsx?)$/.test(file.path))
    .map((file) => file.content)
    .join('\n');
  const issues: string[] = [];
  let score = 100;

  const genericCopyHits = GENERIC_COPY.filter((pattern) => pattern.test(source)).length;
  if (genericCopyHits > 0) {
    score -= genericCopyHits * 14;
    issues.push(`generic fallback copy detected (${genericCopyHits})`);
  }

  // Scanned against the source rather than an extracted-text version. An
  // earlier attempt stripped tags and then {...} expressions, but [^}]* runs
  // to the first closing brace, which in a small component is the end of the
  // function -- it silently deleted the very copy it was meant to check. A
  // phone number or email in a class name is not a realistic false positive,
  // and a tel: href is the business's claim anyway.
  const visibleText = source.replace(/\s+/g, ' ');

  const fabrications = expectations.knownFacts
    ? findFabrications(visibleText, expectations.knownFacts)
    : [];
  if (fabrications.length > 0) {
    // Heavier than a formulaic heading. Dull copy is a missed opportunity;
    // an invented phone number or licensing claim is a business telling its
    // customers something untrue.
    score -= Math.min(60, fabrications.length * 20);
    issues.push(`invented facts: ${fabrications.join('; ')}`);
  }

  const headings = literalHeadings(source);

  const slopHits = SLOP_HEADINGS.filter(([, pattern]) =>
    headings.some((heading) => pattern.test(heading))
  );
  if (slopHits.length > 0) {
    score -= slopHits.length * 12;
    issues.push(`formulaic heading pattern(s): ${slopHits.map(([label]) => label).join(', ')}`);
  }

  // The same CTA heading three times across one site is the tell that the
  // build has one idea repeated, not a site with several things to say.
  const headingCounts = new Map<string, number>();
  for (const heading of headings) {
    const key = heading.toLowerCase();
    headingCounts.set(key, (headingCounts.get(key) || 0) + 1);
  }
  const repeatedHeadings = [...headingCounts.entries()].filter(([, count]) => count >= 3);
  if (repeatedHeadings.length > 0) {
    score -= repeatedHeadings.length * 10;
    issues.push(
      `heading repeated across the build: ${repeatedHeadings
        .map(([text, count]) => `"${text.slice(0, 40)}" x${count}`)
        .join(', ')}`
    );
  }

  // Depth floor. Measured interiors ran as low as one section, which reads as
  // a stub rather than a page someone would scroll.
  //
  // A page file usually contains no <section> at all -- it composes imported
  // components, and the sections live inside those. Counting raw <section>
  // here fired on every single build including ones that render seven
  // sections, so composition is what gets counted: section tags plus
  // capitalised component tags, which is what a page actually puts on screen.
  const pageFiles = files.filter((file) => /^src\/app\/.*page\.tsx$/.test(file.path));
  const composedBlocks = (content: string): number => {
    const sections = (content.match(/<section\b/g) || []).length;
    const components = new Set(
      (content.match(/<([A-Z][A-Za-z0-9_]*)\b/g) || []).map((tag) => tag.slice(1))
    );
    // Chrome is injected by the publisher, not authored composition.
    for (const chrome of ['Navbar', 'Footer', 'ClientLayout', 'FormAutoWire', 'Image', 'Link', 'Head', 'Script']) {
      components.delete(chrome);
    }
    return sections + components.size;
  };
  const thinPages = pageFiles.filter((file) => composedBlocks(file.content) < 3);
  if (thinPages.length > 0) {
    score -= Math.min(24, thinPages.length * 8);
    issues.push(
      `${thinPages.length} page(s) with fewer than 3 sections: ${thinPages
        .map((file) => file.path.replace('src/app/', '').replace('/page.tsx', '') || 'home')
        .join(', ')}`
    );
  }

  const repeatedThreeUp = (source.match(/(?:grid-cols-1\s+(?:md:)?grid-cols-3|md:grid-cols-3)/g) || []).length;
  if (repeatedThreeUp >= 3) {
    score -= 16;
    issues.push('repeated three-column grid pattern is dominating the build');
  }

  const imageCount = (source.match(/<img\b|next\/image|<Image\b/g) || []).length;
  if ((contract.industry === 'landscaping' || contract.industry === 'restaurant') && imageCount < 3) {
    score -= 24;
    issues.push(`${contract.industry} build is missing the required image-led composition`);
  }

  const interactionCount = (source.match(/(?:transition-(?:all|colors|transform)|duration-(?:150|200|300|500)|data-parallax|animate-(?:kenburns|marquee|float))/g) || []).length;
  if (interactionCount < 3) {
    score -= 10;
    issues.push('too few restrained interaction or motion affordances');
  }

  // A polished desktop page that collapses into a squeezed desktop layout is
  // still a generic generation failure. Require enough responsive intent to
  // make the mobile contract enforceable without prescribing one framework.
  const responsiveRules = (source.match(/(?:sm|md|lg|xl):(?:grid|flex|hidden|block|text|p-|px-|py-|gap-|items-|justify-|w-|max-w-|min-w-)/g) || []).length;
  if (responsiveRules < 4) {
    score -= 12;
    issues.push('too little responsive layout intent for the curated mobile experience');
  }

  const accessibleStateSignals = (source.match(/(?:aria-|focus-visible|sr-only|role=|disabled=|prefers-reduced-motion)/g) || []).length;
  if (accessibleStateSignals < 2) {
    score -= 8;
    issues.push('interaction states lack sufficient accessible, touch-safe signals');
  }

  // --- Colour contract floor -------------------------------------------------
  // A build where every section is white or gray is the single most common way
  // a generation reads as a template, so it is scored, not just discouraged.
  const darkSurfaces = new Set(
    source.match(/bg-(?:neutral|primary|secondary|accent)-(?:800|900|950)|bg-black/g) || []
  );
  if (darkSurfaces.size === 0) {
    score -= 20;
    issues.push('no dark or deep-brand surface anywhere — the build is a white template');
  }

  const brandSurfaceUses = (source.match(/bg-(?:primary|secondary|accent)-(?:50|100|600|700|800|900|950)/g) || []).length;
  if (brandSurfaceUses < 3) {
    score -= 14;
    issues.push('brand colour barely appears as a surface — it is being used as trim only');
  }

  const grayTokens = (source.match(/\b(?:text|bg|border)-gray-\d{2,3}\b/g) || []).length;
  if (grayTokens > 6) {
    score -= 10;
    issues.push(`gray-* tokens used ${grayTokens} times instead of the palette's neutral-*`);
  }

  // --- Motion contract floor -------------------------------------------------
  const entranceUtilities = new Set(
    source.match(/animate-(?:fade-in-up|fade-in-down|fade-in|slide-in-left|slide-in-right|scale-in|blur-in|rise-in)/g) || []
  );
  if (entranceUtilities.size < 3) {
    score -= 12;
    issues.push(`only ${entranceUtilities.size} distinct entrance animation(s) — the contract assigns one per content role`);
  }

  if (expectations.requiredDeviceId) {
    const signature = DEVICE_SIGNATURES[expectations.requiredDeviceId];
    if (signature && !signature.test(source)) {
      score -= 18;
      issues.push(`required signature device "${expectations.requiredDeviceId}" is missing from the build`);
    }
  }

  const lower = source.toLowerCase();
  if (contract.industry === 'landscaping') {
    if (!/(before.?after|project|garden|patio|plant|hardscape|landscape)/.test(lower)) {
      score -= 22;
      issues.push('landscaping-specific project or material proof is absent');
    }
    if (!/(season|spring|summer|fall|winter|service area|neighborhood|local)/.test(lower)) {
      score -= 10;
      issues.push('landscaping build lacks a seasonal or local cue');
    }
  }

  if (contract.industry === 'restaurant') {
    if (!/(menu|dish|course|chef|ingredient)/.test(lower)) {
      score -= 22;
      issues.push('restaurant build lacks menu or food-specific hierarchy');
    }
    if (!/(reserve|reservation|book a table)/.test(lower)) {
      score -= 18;
      issues.push('restaurant build lacks a reservation conversion path');
    }
    if (!/(hours|open|location|find us)/.test(lower)) {
      score -= 10;
      issues.push('restaurant build lacks visible hours or location treatment');
    }
  }

  return { score: Math.max(0, score), severe: score < 60, issues };
}

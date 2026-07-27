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
 * A deterministic post-generation gate. It deliberately scores only clear,
 * high-signal failure modes; subjective taste stays in the art-direction
 * contract and model prompt instead of becoming a brittle regex rule.
 */
export interface BuildExpectations {
  /** Signature device id named by the motion contract for this build. */
  requiredDeviceId?: string;
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

import type { GenerationConfig } from '@/types/project';
import {
  getDesignVariety,
  overrideVarietyWithUserChoices,
  type DesignVariety,
} from './design-variety';
import {
  createMobbinCurationBrief,
  formatMobbinCurationBrief,
  type MobbinCurationBrief,
} from './mobbin-curation';

export interface DesignReferenceBrief {
  matchedIndustry: string;
  sourceLabels: string[];
  screenFamilies: string[];
  convergedPatterns: string[];
  antiPatterns: string[];
  buildPlan: string[];
  mobbinCuration: MobbinCurationBrief;
}

const SCREEN_FAMILIES: Record<GenerationConfig['siteType'], string[]> = {
  'landing-page': [
    'high-converting homepage hero and primary CTA',
    'social proof, outcome proof, and objection handling',
    'mobile navigation and compact conversion flow',
  ],
  business: [
    'brand-led homepage and services overview',
    'portfolio or case-study storytelling',
    'contact, inquiry, and mobile navigation flows',
  ],
  ecommerce: [
    'collection browsing and product discovery',
    'product detail, cart, and checkout progression',
    'shipping, returns, trust, empty-cart, and success states',
  ],
  saas: [
    'product-led homepage and feature explanation',
    'pricing, comparison, signup, and onboarding flows',
    'dashboard navigation, settings, empty, loading, and success states',
  ],
  'local-service': [
    'local-service homepage and service-area proof',
    'before-and-after, reviews, credentials, and guarantees',
    'quote, booking, call, and mobile navigation flows',
  ],
};

/**
 * Creates one reference-backed design brief for the entire generation.
 *
 * Previously, Site Craft selected reference brands only at component-code
 * generation time. That allowed the palette and page architecture stages to
 * drift toward unrelated defaults. This brief is intentionally deterministic
 * and shared by every stage, keeping research, plan, and implementation tied
 * to the same evidence.
 */
export function createDesignReferenceBrief(
  config: GenerationConfig,
  varietyInput?: DesignVariety
): { brief: DesignReferenceBrief; variety: DesignVariety } {
  const variety = varietyInput ?? overrideVarietyWithUserChoices(
    getDesignVariety(
      config.business.name,
      config.business.industry,
      config.business.description
    ),
    config
  );

  const userReferences = (config.referenceUrls ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => `User reference: ${url}`);

  const brief: DesignReferenceBrief = {
    matchedIndustry: variety.matchedIndustry,
    sourceLabels: [
      ...variety.referenceStyle.references.map((name) => `Established reference: ${name}`),
      ...userReferences,
    ],
    screenFamilies: SCREEN_FAMILIES[config.siteType],
    convergedPatterns: variety.referenceStyle.designMoves,
    antiPatterns: variety.referenceStyle.antiPatterns,
    buildPlan: [
      `Use the ${variety.heroVariant.name} hero pattern and make the primary conversion action visually dominant.`,
      `Use ${variety.navbarVariant.id} navigation and the ${variety.sectionLayout.name} section rhythm.`,
      `Use ${variety.testimonialLayout.name} for proof instead of a generic repeated card row.`,
      `Keep the ${variety.fonts.name} type pairing and ${variety.palette.name} palette coherent on every page.`,
      'Adapt recurring principles, not brand-specific copy, logos, artwork, or a one-to-one screen composition.',
    ],
    mobbinCuration: createMobbinCurationBrief(config, variety),
  };

  return { brief, variety };
}

export function formatDesignReferenceBrief(brief: DesignReferenceBrief): string {
  return `=== REFERENCE RESEARCH BRIEF — USE BEFORE MAKING DESIGN DECISIONS ===
This is a synthesis of established category references and any references supplied by the user. Treat it as design evidence: extract recurring principles, never copy a source screen one-to-one.

Matched category: ${brief.matchedIndustry}

Reference sources:
${brief.sourceLabels.map((item) => `- ${item}`).join('\n')}

Screen and flow families considered:
${brief.screenFamilies.map((item) => `- ${item}`).join('\n')}

Patterns the references converge on:
${brief.convergedPatterns.map((item) => `- ${item}`).join('\n')}

Category-specific anti-patterns:
${brief.antiPatterns.map((item) => `- ${item}`).join('\n')}

Research-backed build plan:
${brief.buildPlan.map((item, index) => `${index + 1}. ${item}`).join('\n')}

${formatMobbinCurationBrief(brief.mobbinCuration)}

Before returning work, verify that every major palette, hierarchy, navigation, proof, and conversion decision traces back to this brief.`;
}

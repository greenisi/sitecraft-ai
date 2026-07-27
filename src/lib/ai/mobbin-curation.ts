import type { GenerationConfig } from '@/types/project';
import type { DesignVariety } from './design-variety';

/**
 * Durable synthesis layer for research carried out through the Mobbin MCP.
 *
 * This deliberately stores design principles rather than source screenshots,
 * copy, brand marks, or a one-to-one composition. Customer generations stay
 * reliable if the research service is unavailable, while future curation can
 * update this versioned library without changing the generation architecture.
 */
export interface MobbinCurationBrief {
  libraryVersion: string;
  focus: string;
  compositionRules: string[];
  mobileRules: string[];
  interactionRules: string[];
  prohibitedShortcuts: string[];
}

const BY_SITE_TYPE: Record<GenerationConfig['siteType'], Pick<MobbinCurationBrief, 'focus' | 'compositionRules'>> = {
  'landing-page': {
    focus: 'decision-first landing pages with one unmistakable next action',
    compositionRules: [
      'Establish the offer, audience, and primary action before decorative content.',
      'Use a proof interruption between the promise and the detailed explanation.',
      'Vary the evidence format: outcome metric, annotated visual, quote, or comparison—not four identical cards.',
    ],
  },
  business: {
    focus: 'brand-led service storytelling that earns an inquiry',
    compositionRules: [
      'Make the point of view and work visible before listing capabilities.',
      'Use case work, process, or people as a change of rhythm between service sections.',
      'Keep the contact path specific to the business rather than a generic final CTA band.',
    ],
  },
  ecommerce: {
    focus: 'product discovery that keeps purchase confidence visible',
    compositionRules: [
      'Lead with product context and collection hierarchy, not a wall of equal product tiles.',
      'Keep price, selection state, delivery/returns confidence, and add-to-cart feedback close to the decision.',
      'Use editorial product stories or comparison cues to interrupt product grids.',
    ],
  },
  saas: {
    focus: 'product-led explanation with visible product proof',
    compositionRules: [
      'Show a real product moment or clearly labeled workflow before feature claims.',
      'Use progressive disclosure for feature depth instead of a long identical-card sequence.',
      'Make pricing, trial, and onboarding expectations legible at the conversion point.',
    ],
  },
  'local-service': {
    focus: 'local trust and a low-friction service request',
    compositionRules: [
      'Surface local proof, service area, and the practical next step early.',
      'Use jobs, outcomes, credentials, or process proof before a generic service list.',
      'Repeat the conversion action at natural decision points without turning the page into banners.',
    ],
  },
};

export function createMobbinCurationBrief(
  config: GenerationConfig,
  variety: DesignVariety
): MobbinCurationBrief {
  const category = BY_SITE_TYPE[config.siteType];

  return {
    libraryVersion: 'mobbin-curated-patterns/v1',
    focus: `${category.focus}; tuned for ${variety.matchedIndustry}`,
    compositionRules: category.compositionRules,
    mobileRules: [
      'At narrow widths, preserve the primary action without horizontal page overflow or a clipped tab row.',
      'Use one clear mobile navigation path; controls must have visible labels or an accessible name and a 44px minimum hit area.',
      'Stack dense comparison, form, and checkout content deliberately; do not rely on desktop flex rows shrinking into unreadable controls.',
    ],
    interactionRules: [
      'Use interaction to clarify state: selected, expanded, loading, success, or error—not to decorate every card.',
      'Use 160–320ms transitions and honor prefers-reduced-motion; content and conversion must work without motion.',
      'Make hover-only information reachable by keyboard and touch.',
    ],
    prohibitedShortcuts: [
      'Do not recreate a source screen, source copy, or a recognizable brand treatment.',
      'Do not default to a centered hero followed by three equal cards, testimonials, and a CTA.',
      'Do not hide primary actions, form feedback, or purchase status behind hover, autoplay, or a fixed overlay.',
    ],
  };
}

export function formatMobbinCurationBrief(brief: MobbinCurationBrief): string {
  return `=== CURATED DESIGN PATTERN LIBRARY (${brief.libraryVersion}) ===
This is a distilled pattern library informed by design research. Apply the principles to an original Sitecraft composition; do not copy source screens, brands, assets, or wording.

Focus: ${brief.focus}

Composition requirements:
${brief.compositionRules.map((rule) => `- ${rule}`).join('\n')}

Mobile requirements:
${brief.mobileRules.map((rule) => `- ${rule}`).join('\n')}

Interaction requirements:
${brief.interactionRules.map((rule) => `- ${rule}`).join('\n')}

Prohibited shortcuts:
${brief.prohibitedShortcuts.map((rule) => `- ${rule}`).join('\n')}`;
}

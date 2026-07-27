import type { GenerationConfig, PageBlueprint } from '@/types/project';
import type { DesignVariety } from './design-variety';

type Positioning = 'value' | 'considered' | 'premium';

export interface ArtDirectionContract {
  industry: string;
  audience: string;
  positioning: Positioning;
  personality: string;
  conversionAction: string;
  localContext: string;
  signatureComposition: string;
  requiredHomeSections: string[];
  requiredSignals: string[];
  motionRules: string[];
  forbiddenPatterns: string[];
}

const GENERIC_COPY = /\b(?:welcome to (?:our|the) website|your trusted partner|committed to excellence|one-stop shop|lorem ipsum)\b/i;

function hash(input: string): number {
  let result = 0;
  for (let index = 0; index < input.length; index += 1) {
    result = ((result << 5) - result + input.charCodeAt(index)) | 0;
  }
  return Math.abs(result);
}

function firstMatch(input: string, expression: RegExp): string {
  return input.match(expression)?.[1]?.trim() || '';
}

function inferPositioning(config: GenerationConfig): Positioning {
  const source = `${config.business.description} ${config.business.targetAudience} ${config.aiPrompt}`.toLowerCase();
  if (/luxury|premium|bespoke|boutique|custom|estate|high-end|fine dining|chef-led|design-build|white.?glove/.test(source)) return 'premium';
  if (/affordable|budget|same-day|discount|fast|value|lowest|deal/.test(source)) return 'value';
  return 'considered';
}

function inferAction(config: GenerationConfig): string {
  const source = `${config.aiPrompt} ${config.business.description}`.toLowerCase();
  if (/reserve|reservation/.test(source)) return 'Reserve a table';
  if (/book|appointment|consult/.test(source)) return 'Book a consultation';
  if (/call|phone|24\/7/.test(source)) return 'Call now';
  if (/shop|buy|order/.test(source) || config.siteType === 'ecommerce') return 'Shop the collection';
  if (/subscribe|trial/.test(source) || config.siteType === 'saas') return 'Start a trial';
  return config.siteType === 'local-service' ? 'Request a quote' : 'Start a conversation';
}

function inferPersonality(config: GenerationConfig, variety: DesignVariety): string {
  const fromJourney = firstMatch(config.aiPrompt, /experience should feel ([^.\n]+)[.\n]/i);
  if (fromJourney) return fromJourney;
  return `${variety.palette.mood}, ${variety.fonts.vibe}, and ${config.branding.style}`;
}

function inferLocalContext(config: GenerationConfig): string {
  return firstMatch(config.aiPrompt, /serving ([^.\n]+)/i) || firstMatch(config.aiPrompt, /location:\s*([^\n]+)/i);
}

function landscapingContract(seed: number): Pick<ArtDirectionContract, 'signatureComposition' | 'requiredHomeSections' | 'requiredSignals' | 'motionRules' | 'forbiddenPatterns'> {
  const signatures = [
    'A project-journal composition: an asymmetric full-bleed outdoor image, a small project caption with place/season, then editorial project rows rather than service cards.',
    'A material-led composition: a close crop of stone, timber, planting, or water anchors the hero while project work appears as a staggered field-note grid.',
    'A landscape-architect composition: the hero holds a quiet 7/5 grid, followed by a before/after proof strip and an alternating design/build/maintain decision path.',
    'A seasonal composition: an atmospheric hero leads into a horizontal seasonal-care rail, then project photography broken by a single outdoor-living image interlude.',
  ];
  return {
    signatureComposition: signatures[seed % signatures.length],
    requiredHomeSections: ['ProjectGallery', 'BeforeAfter', 'ServiceAreaProof', 'ConsultationPaths'],
    requiredSignals: ['at least three real outdoor/project images', 'a local service-area or neighborhood cue', 'a seasonal or climate-aware detail', 'design/build/maintenance paths that do not collapse into one generic service list'],
    motionRules: ['Use 8–16px slow parallax only on outdoor imagery.', 'Use gentle image crop drift or caption rise; never bounce, spin, or animate every card.', 'Keep motion optional and respect prefers-reduced-motion.'],
    forbiddenPatterns: ['three equal icon service cards as the first proof section', 'bright tech gradients', 'generic construction yellow/black styling', 'stock office/team imagery'],
  };
}

function restaurantContract(seed: number): Pick<ArtDirectionContract, 'signatureComposition' | 'requiredHomeSections' | 'requiredSignals' | 'motionRules' | 'forbiddenPatterns'> {
  const signatures = [
    'A dining-room editorial composition: a cinematic food or room image, a compact reservation cue, then an offset menu preview with prices and a chef/ingredient interlude.',
    'A menu-led composition: oversized type and a restrained color field lead directly into a curated menu chapter, with reservations and hours visible before the second scroll.',
    'An atmosphere-led composition: layered room and dish photography with a single pull quote, followed by a reserve-first bar and menu categories as editorial bands.',
    'A chef-table composition: ingredient texture and a precise typographic hero, then a chef story and seasonal menu rail rather than a generic feature grid.',
  ];
  return {
    signatureComposition: signatures[seed % signatures.length],
    requiredHomeSections: ['MenuPreview', 'ReservationBar', 'AtmosphereGallery', 'HoursLocation'],
    requiredSignals: ['visible menu categories or dishes with real prices when supplied', 'reservation action above the fold and repeated near the menu', 'hours and location treatment before the footer', 'at least three food/dining/ingredient images'],
    motionRules: ['Use slow Ken Burns image movement or a single reveal for food photography.', 'Use short opacity/translate transitions for menu category changes.', 'Never use floating glass SaaS cards, aggressive scroll effects, or autoplay audio.'],
    forbiddenPatterns: ['contractor trust badges', 'emergency-call banners', 'generic service cards', 'cold clinical blues unless the brand explicitly requests them'],
  };
}

function defaultContract(config: GenerationConfig): Pick<ArtDirectionContract, 'signatureComposition' | 'requiredHomeSections' | 'requiredSignals' | 'motionRules' | 'forbiddenPatterns'> {
  return {
    signatureComposition: 'One page-specific composition that changes the rhythm: an image interlude, asymmetrical proof block, horizontal gallery, or editorial index—not a repeated card grid.',
    requiredHomeSections: [],
    requiredSignals: ['one business-specific proof treatment', 'one visual composition that is not a centered card grid', 'clear primary conversion action'],
    motionRules: ['Animate hierarchy and feedback, not decoration.', 'Use 160–320ms interaction transitions and one slow ambient image treatment at most.', 'Respect prefers-reduced-motion and keep all content visible without JavaScript.'],
    forbiddenPatterns: ['repeating Hero → three cards → testimonials → CTA without an industry-specific interruption', 'multiple rainbow gradients', 'decorative emoji or floating blobs'],
  };
}

export function createArtDirectionContract(config: GenerationConfig, variety: DesignVariety): ArtDirectionContract {
  const industry = variety.matchedIndustry;
  const seed = hash(`${config.business.name}:${industry}:${config.business.description}`);
  const details = industry === 'landscaping'
    ? landscapingContract(seed)
    : industry === 'restaurant'
      ? restaurantContract(seed)
      : defaultContract(config);

  return {
    industry,
    audience: config.business.targetAudience || 'the primary buyer described in the brief',
    positioning: inferPositioning(config),
    personality: inferPersonality(config, variety),
    conversionAction: inferAction(config),
    localContext: inferLocalContext(config),
    ...details,
  };
}

function sectionMatches(section: { componentName: string }, name: string): boolean {
  return section.componentName.toLowerCase().includes(name.toLowerCase());
}

/**
 * Normalizes an AI-authored blueprint into a small, testable design contract.
 * This is intentionally structural: it does not dictate a visual clone, but it
 * prevents the common generic outline from being the entire site plan.
 */
export function applyArtDirectionToBlueprint(
  blueprint: PageBlueprint,
  contract: ArtDirectionContract
): PageBlueprint {
  const pages: PageBlueprint['pages'] = blueprint.pages.map((page) => ({
    ...page,
    sections: page.sections.map((section) => ({
      ...section,
      props: {
        ...section.props,
        artDirection: {
          positioning: contract.positioning,
          personality: contract.personality,
          conversionAction: contract.conversionAction,
          localContext: contract.localContext || undefined,
        },
      },
    })),
  }));

  const home = pages.find((page) => page.path === '/');
  if (!home) return { ...blueprint, pages };

  for (const componentName of contract.requiredHomeSections) {
    if (home.sections.some((section) => sectionMatches(section, componentName))) continue;
    const insertAt = Math.min(Math.max(2, home.sections.length - 2), home.sections.length);
    home.sections.splice(insertAt, 0, {
      componentName,
      order: insertAt,
      props: {
        artDirection: {
          required: true,
          signatureComposition: contract.signatureComposition,
          conversionAction: contract.conversionAction,
          requiredSignals: contract.requiredSignals,
        },
      } as Record<string, unknown>,
    });
  }

  home.sections = home.sections.map((section, order) => ({ ...section, order }));
  return { ...blueprint, pages };
}

export function formatArtDirectionContract(contract: ArtDirectionContract, blueprint: PageBlueprint): string {
  const home = blueprint.pages.find((page) => page.path === '/');
  return `=== ART DIRECTION CONTRACT — IMPLEMENT, DO NOT PARAPHRASE ===
Business category: ${contract.industry}
Audience: ${contract.audience}
Positioning: ${contract.positioning}
Brand personality: ${contract.personality}
Primary conversion: ${contract.conversionAction}
${contract.localContext ? `Local context: ${contract.localContext}` : ''}

SIGNATURE COMPOSITION
${contract.signatureComposition}

REQUIRED EVIDENCE IN THE HOMEPAGE
${contract.requiredSignals.map((signal) => `- ${signal}`).join('\n')}

MOTION AND INTERACTION
${contract.motionRules.map((rule) => `- ${rule}`).join('\n')}

FORBIDDEN FOR THIS BUILD
${contract.forbiddenPatterns.map((pattern) => `- ${pattern}`).join('\n')}

ENFORCED HOMEPAGE COMPONENT MAP
${home?.sections.map((section) => `- ${section.order + 1}. ${section.componentName}${section.props.artDirection ? ' (art-directed)' : ''}`).join('\n') || '- Use the page blueprint'}

Implementation rules:
- Each required section must be a real rendered component or an identifiable section in the page file; do not leave it as a comment or placeholder.
- Use image-led composition, real hierarchy, and content-specific labels. Do not solve this contract with a generic three-card grid.
- Keep all interaction keyboard-accessible, responsive, and fully usable with reduced motion.`;
}

export function hasGenericCopy(content: string): boolean {
  return GENERIC_COPY.test(content);
}

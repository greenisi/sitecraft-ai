import type { GenerationConfig, DesignSystem, PageBlueprint } from '@/types/project';
import type { GenerationEvent, VirtualFile } from '@/types/generation';
import { VirtualFileTree } from '@/types/generation';
import { parse as babelParse } from '@babel/parser';
import {
  completeGenerationText,
  getAnthropicClient,
  GENERATION_MODEL,
  streamGenerationText,
  TOKEN_LIMITS,
  withRetry,
} from './client';
import {
  type ModelConfig,
  type ModelTier,
  getModelConfig,
  DEFAULT_PRO_TIER,
} from './models';

// Resolve the provider/model pair selected by the branded tier.
function resolveModelConfig(tier?: ModelTier): ModelConfig {
  return getModelConfig(tier ?? DEFAULT_PRO_TIER);
}

function buildTierExecutionBrief(model: ModelConfig): string {
  if (model.tier !== 'architect') return '';
  return `=== POWER MODE EXECUTION ===
- Plan and implement a genuinely complex multi-page experience, not a long homepage with shallow duplicate interior pages.
- Give every page a distinct information architecture and at least one page-specific visual composition.
- Build working client-side interactions where they improve the experience: responsive navigation, tabs, accordions, filters, galleries, sliders, calculators, multi-step forms, and contextual state. Use React state and the project's existing dependencies only.
- Every visible control must work. Never draw fake buttons, filters, dropdowns, or form steps.
- Preserve useful state during interaction, provide empty/error/success feedback, and make keyboard focus visible.
- Use shared data and reusable components where content repeats, while keeping page layouts compositionally distinct.
- Keep all generated functionality compatible with the preview sandbox and static deployment. Do not invent an unavailable database, API, authentication system, or external service.
- Spend the extra reasoning budget on hierarchy, flow completeness, responsive behavior, code integrity, and refined art direction—not decorative clutter.`;
}
import { buildSystemPrompt } from './prompts/system-prompt';
import { buildLandingPagePrompt } from './prompts/landing-page';
import { buildBusinessPortfolioPrompt } from './prompts/business-portfolio';
import { buildEcommercePrompt } from './prompts/ecommerce';
import { buildSaasPrompt } from './prompts/saas';
import { buildLocalServicePrompt } from './prompts/local-service';
import { parseDesignSystem, parseBlueprint, extractCompletedBlocks } from './parsers';
import { enforceReadableScales } from './contrast-guard';
import { repairDeadImageUrls, createGalleryContext } from './image-guard';
import { injectSectionDividers, injectLayoutRuntimes } from './divider-injector';
import { generateDynamicsRuntimeComponent } from '@/lib/templates/base/dynamics-runtime';
import { enforceLinkIntegrity } from './link-guard';
import { injectBookingForm } from './booking-injector';
import { pickSiteMotion, varyInteriorRhythm } from './motion-variety';
import { buildGalleryPromptBlock, getIndustryGallery } from './image-gallery';
import { generateSectionDividerComponent } from '@/lib/templates/base/section-divider';
import {
  generateSectionKitFiles,
  buildSectionKitPromptBlock,
} from '@/lib/templates/base/section-kit';
import {
  generateBookingFormComponent,
  deriveBookingOptions,
} from '@/lib/templates/base/booking-form';
import { generateTailwindConfig } from '@/lib/templates/base/tailwind-config';
import { generatePackageJson } from '@/lib/templates/base/package-json';
import { generateNextConfig } from '@/lib/templates/base/next-config';
import { generateTsConfig } from '@/lib/templates/base/tsconfig';
import {
  generateRobotsTs,
  generateSitemapTs,
  generateSeoSchemaComponent,
} from '@/lib/templates/base/seo';
import {
  buildVarietyInstructions,
  getIndustryPaletteGuidance,
  type DesignVariety,
} from './design-variety';
import {
  createDesignReferenceBrief,
  formatDesignReferenceBrief,
  type DesignReferenceBrief,
} from './reference-research';
import {
  applyArtDirectionToBlueprint,
  createArtDirectionContract,
  formatArtDirectionContract,
  type ArtDirectionContract,
} from './art-direction';
import { createColorContract, formatColorContract } from './color-contract';
import { createMotionContract, formatMotionContract } from './motion-contract';
import { evaluateDesignQuality } from './design-quality-gate';
import { scrubFabricatedContacts } from './fabrication-scrub';
import { scrubFormulaicHeadings } from './heading-scrub';

// --------------------------------------------------------------------------
// Stage 1: Assemble Config
// --------------------------------------------------------------------------

/**
 * Merges and validates the raw form data into a finalized GenerationConfig.
 * In practice this is mostly a pass-through, but it is the right place to
 * apply defaults, normalise values, and do any last-minute enrichment.
 */
function assembleConfig(config: GenerationConfig): GenerationConfig {
  return {
    ...config,
    business: {
      ...config.business,
      name: config.business.name.trim(),
      description: config.business.description.trim(),
      industry: config.business.industry.trim(),
      targetAudience: config.business.targetAudience.trim(),
    },
    sections: config.sections
      .sort((a, b) => a.order - b.order)
      .map((s, idx) => ({ ...s, order: idx })),
    aiPrompt: config.aiPrompt?.trim() ?? '',
  };
}

// --------------------------------------------------------------------------
// Stage 2: Generate Design System
// --------------------------------------------------------------------------

export async function generateDesignSystem(
  config: GenerationConfig,
  referenceBrief?: DesignReferenceBrief
): Promise<DesignSystem> {
  const systemPrompt = `You are a design system expert who creates UNIQUE, visually distinctive color systems for each project. Given a business description and branding preferences, generate a comprehensive Tailwind CSS design system as a JSON object.

Return ONLY valid JSON -- no markdown, no explanation, no code fences.

The JSON must match this exact structure:
{
  "colors": {
    "primary":   { "50": "#...", "100": "#...", ..., "900": "#...", "950": "#..." },
    "secondary": { "50": "#...", "100": "#...", ..., "900": "#...", "950": "#..." },
    "accent":    { "50": "#...", "100": "#...", ..., "900": "#...", "950": "#..." },
    "neutral":   { "50": "#...", "100": "#...", ..., "900": "#...", "950": "#..." }
  },
  "typography": {
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "scale": {
      "xs":   { "size": "0.75rem",  "lineHeight": "1rem",    "weight": "400" },
      "sm":   { "size": "0.875rem", "lineHeight": "1.25rem", "weight": "400" },
      "base": { "size": "1rem",     "lineHeight": "1.5rem",  "weight": "400" },
      "lg":   { "size": "1.125rem", "lineHeight": "1.75rem", "weight": "500" },
      "xl":   { "size": "1.25rem",  "lineHeight": "1.75rem", "weight": "600" },
      "2xl":  { "size": "1.5rem",   "lineHeight": "2rem",    "weight": "600" },
      "3xl":  { "size": "1.875rem", "lineHeight": "2.25rem", "weight": "700" },
      "4xl":  { "size": "2.25rem",  "lineHeight": "2.5rem",  "weight": "700" }
    }
  },
  "spacing": { "xs": "0.25rem", "sm": "0.5rem", "md": "1rem", "lg": "1.5rem", "xl": "2rem", "2xl": "3rem", "3xl": "4rem" },
  "borderRadius": { "none": "0", "sm": "0.125rem", "md": "0.375rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "full": "9999px" },
  "shadows": { "sm": "...", "md": "...", "lg": "...", "xl": "..." }
}

READ THE OWNER'S MIND — DO THIS SILENTLY BEFORE GENERATING (do not output this reasoning):
From the business type and description alone, infer:
1. WHO the customer is (homeowner in a hurry? CFO comparing vendors? bride planning a date? foodie browsing on a phone?)
2. What that customer is AFRAID of when hiring/buying in this industry (getting ripped off, no-shows, hidden fees, amateur work, wasted money)
3. What builds INSTANT TRUST in this specific industry (licenses, photos of real work, credentials, press, reviews, guarantees)
4. The PRICE-POINT FEEL: budget, mid-market, or premium — read it from the description's language and offerings
5. The ONE action this site exists to drive (call, book, reserve, buy, request quote, sign up)
Then make every color decision serve those five inferences. A premium med-spa and a budget junk-removal crew must NOT receive interchangeable palettes: price-point feel changes saturation and contrast (premium = deeper, quieter, more restrained; budget/urgent = brighter, higher-energy, action-forward), and the customer's fears change how "safe" vs "bold" the palette must read. The owner should look at the palette and think "how did it know exactly what my business feels like?"

CRITICAL RULES:
- Generate color scales that harmonize with the provided brand colors. Each scale needs shades from 50 (lightest) through 950 (darkest).
- The provided hex colors should map to the 500 shade.
- The PRIMARY and SECONDARY colors should have CLEAR VISUAL CONTRAST — they should not look similar.
- The ACCENT color should POP — it's used for CTA buttons and attention-grabbing elements.
- The NEUTRAL palette should complement the primary, not just be generic gray. For warm primaries use warm neutrals (stone, amber tints). For cool primaries use cool neutrals (slate, blue-gray).
- Make each color scale RICH with distinct shades — the 50 should be very light, the 950 very dark.

TEXT CONTRAST — NON-NEGOTIABLE:
- Shades 50-200 are BACKGROUND shades — they MUST be light enough that dark text (gray-900, primary-900, neutral-900) is easily readable on top of them.
- Shades 700-950 are DARK shades — they MUST be dark enough that white or very light text is easily readable on top of them.
- NEVER generate shades where 50-200 are mid-tones — they must be very light/pastel.
- The 50 shade should be almost white with just a hint of color. The 100 shade should be very pale.
- This ensures WCAG AA contrast (4.5:1 minimum) when pairing light backgrounds with dark text and dark backgrounds with light text.`;

  // Derive industry-specific palette guidance so the design system locks
  // onto the vertical's color character (e.g. landscaping → greens + earth
  // tones) instead of defaulting to generic dark navy + neutral grays.
  const guidance = getIndustryPaletteGuidance(
    config.business.industry,
    config.business.description
  );

  const researchBlock = referenceBrief
    ? `\n${formatDesignReferenceBrief(referenceBrief)}\n`
    : '';

  const userPrompt = `Generate a UNIQUE, distinctive design system for:
Business: "${config.business.name}" (${config.business.industry})
Description: ${config.business.description}
Style: ${config.branding.style}
Heading font: ${config.branding.fontHeading}
Body font: ${config.branding.fontBody}
${config.aiPrompt ? `User creative direction: ${config.aiPrompt}` : ''}

=== INDUSTRY-DRIVEN PALETTE — THIS DOMINATES COLOR DECISIONS ===
Matched industry: ${guidance.matchedIndustry}
Palette character: ${guidance.paletteCharacter}

Anchor reference (a known-good palette for this industry — your output should
share its CHARACTER, not copy these hex codes exactly):
- Primary anchor:   ${guidance.examplePalette.primary} (${guidance.examplePalette.name}, mood: ${guidance.examplePalette.mood})
- Secondary anchor: ${guidance.examplePalette.secondary}
- Accent anchor:    ${guidance.examplePalette.accent}

User-supplied branding inputs (treat as SOFT preferences — only honor them if
they are clearly intentional and don't fight the industry character):
- Primary:   ${config.branding.primaryColor}
- Secondary: ${config.branding.secondaryColor}
- Accent:    ${config.branding.accentColor}
${config.branding.surfaceColor ? `- Surface:   ${config.branding.surfaceColor}` : ''}

CRITICAL — read this twice:
- The palette MUST evoke the matched industry's character described above.
- If the user-supplied colors clash with the industry character (e.g. user
  picked navy for a landscaping site), OVERRIDE them with industry-appropriate
  colors. The user's description tells you what kind of business this is —
  that ALWAYS wins over generic form defaults.
- The 500 shade of primary should be the dominant brand color and should
  embody the industry character — not the user's input verbatim if it conflicts.
- Make the colors rich and distinctive. NO generic Tailwind blue. NO default
  slate. The palette should feel deliberately chosen for THIS vertical.
${researchBlock}`;

  const model = resolveModelConfig(config.modelTier);
  const text = await withRetry(() => completeGenerationText(
    model,
    systemPrompt,
    userPrompt,
    TOKEN_LIMITS.designSystem,
    {
      jsonOutput: true,
      // Power Mode reserves its deepest reasoning for the component/code
      // pass. Palette JSON is tightly specified and deterministic validation
      // follows it, so a bounded planning effort avoids consuming most of the
      // five-minute request window before any site code is generated.
      reasoningEffort: model.reasoningEffort === 'max' ? 'low' : model.reasoningEffort,
    },
  ));

  // Deterministic guarantee: clamp every scale so light shades (50-200) hold
  // WCAG AA against dark text and dark shades (700-950) against white text,
  // regardless of what the model emitted. Prompts guide; math enforces.
  return enforceReadableScales(parseDesignSystem(text));
}

// --------------------------------------------------------------------------
// Stage 3: Generate Blueprint
// --------------------------------------------------------------------------

async function generateBlueprint(
  config: GenerationConfig,
  designSystem: DesignSystem,
  referenceBrief: DesignReferenceBrief,
  artDirection: ArtDirectionContract
): Promise<PageBlueprint> {
  const model = resolveModelConfig(config.modelTier);
  const systemPrompt = `You are a website architecture expert. Given a site configuration and design system, generate a page blueprint as a JSON object.

Return ONLY valid JSON -- no markdown, no explanation, no code fences.

The JSON must match this exact structure:
{
  "pages": [
    {
      "path": "/",
      "title": "Home",
      "sections": [
        { "componentName": "Hero", "props": {}, "order": 0 },
        { "componentName": "Features", "props": {}, "order": 1 }
      ],
      "metadata": { "title": "Page Title", "description": "Meta description" }
    }
  ],
  "sharedComponents": ["Navbar", "Footer"],
  "dataRequirements": {}
}

Rules:
- Component names must be PascalCase.
- Each page must have at least one section.
- Include all shared components (Navbar, Footer, etc.) in sharedComponents.
- The props object can include content hints for the AI component generator.
- For e-commerce sites, include dataRequirements for product data.
- For SaaS sites, include dataRequirements for pricing/features data.
- Blueprint sections must match the actual industry. For example: landscaping should include project/gallery/before-after/service-area sections; construction should include project/capabilities/process/safety sections; restaurants should include menu/reservations/chef/press sections; real estate should include listings/neighborhoods/valuation sections.
- Do not use generic local-trade pages or emergency-call sections for restaurants, creative studios, real estate, healthcare, or other non-emergency industries unless the user's prompt asks for them.

READ THE OWNER'S MIND — DO THIS SILENTLY BEFORE GENERATING (do not output this reasoning):
From the business type and description, infer: (1) WHO the customer is, (2) what they're AFRAID of when buying in this industry, (3) what builds INSTANT TRUST here, (4) the PRICE-POINT FEEL (budget/mid/premium), and (5) the ONE action the site exists to drive. Then:
- The very first section after the hero must answer the customer's biggest fear (proof of work, credentials, reviews, guarantees — whatever this industry's customers check first).
- The ONE primary action must have a dedicated section AND appear in the hero — name it concretely in componentName/props ("BookingCTA", "ReservationBar", "QuoteRequest", "EmergencyCall"), not a generic "CTA".
- Section ORDER must mirror how this industry's customer actually decides: restaurants lead with menu/atmosphere and put hours/location prominently; trades lead with proof (before/after, service area) and licensing; premium services lead with portfolio and story; emergency services lead with the phone number.
- Vary the section rhythm per industry — do NOT emit the same Hero→Features→Testimonials→CTA skeleton for every site. Choose at least one industry-signature section a competitor template would not have (e.g. FinancingOptions for roofers, ChefStory for restaurants, NeighborhoodGuides for realtors, SecurityCompliance for B2B SaaS) and include it in props as a content hint.
- Use the props object to pass these inferences as content hints (e.g. { "audience": "...", "trustAngle": "...", "primaryAction": "..." }) so the component generator can act on them.
- ASSIGN VISUAL TREATMENT PER SECTION in props: every section gets { "background": "white" | "tinted" | "dark", "decor": one of "dot-grid" | "gradient-ring" | "outline-word" | "glass-chip" | "marquee-strip" | "none", "entrance": one of "fade-up" | "slide-left" | "slide-right" | "scale-in" | "blur-in" }. Alternate backgrounds (never two identical in a row), spread at least four distinct decor devices and three distinct entrances across the homepage, and give the homepage 9-12 sections minimum including a Gallery/Portfolio section and a full-width MarqueeStrip.`;

  const sectionsSummary = config.sections
    .map((s) => `${s.type} (order: ${s.order})`)
    .join(', ');

  const userPrompt = `Generate a page blueprint for:
Site type: ${config.siteType}
Business: "${config.business.name}" (${config.business.industry})
Requested sections: ${sectionsSummary}
Design style: ${config.branding.style}
Heading font: ${designSystem.typography.headingFont}
Body font: ${designSystem.typography.bodyFont}
${config.aiPrompt ? `User creative direction: ${config.aiPrompt}` : ''}
${config.ecommerce ? `E-commerce: ${config.ecommerce.products.length} products, cart ${config.ecommerce.cartEnabled ? 'enabled' : 'disabled'}` : ''}
${config.saas ? `SaaS: ${config.saas.features.length} features, ${config.saas.pricingTiers.length} pricing tiers, auth ${config.saas.hasAuth ? 'yes' : 'no'}, dashboard ${config.saas.hasDashboard ? 'yes' : 'no'}` : ''}

${formatDesignReferenceBrief(referenceBrief)}

${formatArtDirectionContract(artDirection, { pages: [], sharedComponents: [], dataRequirements: {} })}

${buildTierExecutionBrief(model)}`;

  const text = await withRetry(() => completeGenerationText(
    model,
    systemPrompt,
    userPrompt,
    TOKEN_LIMITS.blueprint,
    {
      jsonOutput: true,
      // The art-direction contract deterministically amends this plan after
      // parsing. Keep planning responsive, then spend the Max reasoning budget
      // on the high-value composition and implementation stage.
      reasoningEffort: model.reasoningEffort === 'max' ? 'low' : model.reasoningEffort,
    },
  ));

  return varyInteriorRhythm(
    applyArtDirectionToBlueprint(parseBlueprint(text), artDirection),
    config.business.name,
    config.business.description
  );
}

// --------------------------------------------------------------------------
// Stage 4: Generate Components (streaming)
// --------------------------------------------------------------------------

/**
 * Returns the appropriate user prompt builder for the given site type.
 */
function getPromptBuilder(siteType: GenerationConfig['siteType']) {
  switch (siteType) {
    case 'landing-page':
      return buildLandingPagePrompt;
    case 'business':
      return buildBusinessPortfolioPrompt;
    case 'ecommerce':
      return buildEcommercePrompt;
    case 'saas':
      return buildSaasPrompt;
    case 'local-service':
      return buildLocalServicePrompt;
    default: {
      const _exhaustive: never = siteType;
      throw new Error(`Unknown site type: ${_exhaustive}`);
    }
  }
}

/**
 * Returns true if the given TSX/TS source parses cleanly with @babel/parser.
 * This is the authoritative syntax check — `checkBasicSyntax` only counts
 * delimiters and misses many real errors.
 */
/**
 * Scans for shadeless brand-color Tailwind classes (e.g. `text-primary`,
 * `bg-primary`, `from-primary`). These are INVALID — Tailwind requires a
 * shade number on custom theme colors, so `text-primary` resolves to nothing
 * and breaks gradients, text, backgrounds. Returns the list of offending
 * class strings. The model frequently emits these, especially in gradient
 * declarations like `bg-gradient-to-br from-primary via-primary to-primary-600`.
 */
export function findShadelessBrandColors(content: string): string[] {
  if (!/\b(?:text|bg|from|via|to|border|ring|fill|stroke|divide|outline|shadow|accent)-(?:primary|secondary|accent|neutral)\b(?!-)/.test(content)) {
    return [];
  }
  const bugs: string[] = [];
  const seen = new Set<string>();
  const re = /\b(text|bg|from|via|to|border|ring|fill|stroke|divide|outline|shadow|accent)-(primary|secondary|accent|neutral)\b(?!-)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const key = `${m[1]}-${m[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      bugs.push(`shadeless brand color: \`${m[0]}\` should be \`${m[0]}-500\` or similar with a shade number`);
    }
  }
  return bugs;
}

/**
 * Scans a TSX file for unambiguous contrast violations on the same element.
 * Returns a list of human-readable problems; an empty list means no obvious
 * bugs were found (does not catch nested-element cases — for those we still
 * rely on the system prompt rules and AI repair).
 *
 * The check looks at each className string and flags:
 *   - text-white / text-gray-{50..200} on bg-white / bg-gray-{50..200} / bg-*-50/100
 *   - text-black / text-gray-{800..950} / text-*-900/950 on bg-gray-{800..950} / bg-*-800/900/950
 */
export function findContrastBugs(content: string): string[] {
  if (!/className\s*=/.test(content)) return [];

  const bugs: string[] = [];
  const classMatches = content.matchAll(/className\s*=\s*["'`]([^"'`]+)["'`]/g);

  // Same-element checks use OPAQUE backgrounds only — the (?!\/) lookahead
  // excludes opacity-suffixed classes like bg-white/10 (glass cards over a
  // dark hero) whose real surface depends on what's behind them.
  const LIGHT_BG = /\bbg-(?:white|gray-(?:50|100|200)|slate-(?:50|100|200)|neutral-(?:50|100|200)|stone-(?:50|100|200)|zinc-(?:50|100|200)|\w+-(?:50|100|200))(?!\/)\b/;
  const LIGHT_TEXT = /\btext-(?:white|gray-(?:50|100|200|300)|slate-(?:50|100|200|300)|neutral-(?:50|100|200|300)|\w+-(?:50|100|200|300))\b/;
  // 700 included — the contrast guard mathematically guarantees bg-*-700
  // passes AA against white text, so it's a legitimate dark surface, and
  // dark text on it is a real bug.
  const DARK_BG = /\bbg-(?:black|gray-(?:700|800|900|950)|slate-(?:700|800|900|950)|neutral-(?:700|800|900|950)|stone-(?:700|800|900|950)|zinc-(?:700|800|900|950)|\w+-(?:700|800|900|950))(?!\/)\b/;
  const DARK_TEXT = /\btext-(?:black|gray-(?:700|800|900|950)|slate-(?:700|800|900|950)|neutral-(?:700|800|900|950)|\w+-(?:700|800|900|950))\b/;
  // Dark-text-on-mid flag: only 500/600 of hues where white text is actually
  // the correct pairing. High-luminance hues (amber/yellow/lime/cyan/sky/
  // orange) correctly pair with DARK text at these shades — flagging them
  // would make the AI repair switch to white text and make contrast WORSE.
  const MID_BG_FOR_DARK_TEXT = /\bbg-(?!(?:amber|yellow|lime|cyan|sky|orange)-)\w+-(?:500|600)(?!\/)\b/;

  // Drop any class carrying a state variant ANYWHERE in its prefix chain
  // (md:hover:bg-primary-50 must not count as a rendered background), then
  // strip responsive prefixes — a bg that changes at a breakpoint still
  // renders, so those combos are real.
  const stripStateVariants = (cls: string) =>
    cls
      .split(/\s+/)
      .filter((c) => !/(?:^|:)(?:hover|focus|focus-within|focus-visible|active|visited|disabled|group-hover|group-focus|peer-[\w-]*|aria-[\w-]+|dark)[:/]/.test(c))
      .map((c) => c.replace(/(?:sm|md|lg|xl|2xl):/g, ''))
      .join(' ');

  for (const match of classMatches) {
    const cls = stripStateVariants(match[1]);

    if (LIGHT_BG.test(cls) && LIGHT_TEXT.test(cls)) {
      bugs.push(`light text on light background — classes: "${match[1].slice(0, 140)}"`);
    }
    if (DARK_BG.test(cls) && DARK_TEXT.test(cls)) {
      bugs.push(`dark text on dark background — classes: "${match[1].slice(0, 140)}"`);
    }
    if (MID_BG_FOR_DARK_TEXT.test(cls) && DARK_TEXT.test(cls)) {
      bugs.push(`dark text on mid-tone background (bg-*-500/600 needs white text) — classes: "${match[1].slice(0, 140)}"`);
    }
  }

  // File-level heuristic for the classic invisible-hero bug: light text used
  // somewhere in the file, but NO dark surface exists anywhere — no dark bg
  // class, no dark gradient stop, no photo overlay (bg-black/40 style), no
  // absolutely-positioned <img> backdrop. Same-element checks can't see
  // nested parents, so this catches text-white inside a section whose
  // wrapper is bg-white.
  const usesLightText = /\btext-(?:white|gray-(?:50|100|200)|slate-(?:50|100|200)|neutral-(?:50|100|200)|\w+-(?:50|100|200))\b/.test(content);
  if (usesLightText) {
    // Unlike the same-element checks, dark-surface detection here is
    // opacity-TOLERANT (bg-primary-900/40 overlays are dark surfaces) and
    // includes mid shades — this check fails open on purpose.
    const hasDarkSurface =
      /\bbg-(?:black|\w+-(?:400|500|600|700|800|900|950))(?:\/\d+)?\b/.test(content) ||
      // Any gradient stop at 500+ (or black, incl. /opacity forms) can carry white text
      /\b(?:from|via|to)-(?:black|\w+-(?:500|600|700|800|900|950))(?:\/\d+)?\b/.test(content) ||
      // Style-prop or arbitrary-value background images (banned but possible)
      /backgroundImage|bg-\[url/.test(content) ||
      (/<img\b/i.test(content) && /\babsolute\b[^"'`]*\binset-0\b|\binset-0\b[^"'`]*\babsolute\b/.test(content));
    if (!hasDarkSurface) {
      bugs.push(
        'light/white text used but the file contains no dark background, dark gradient stop, or photo overlay anywhere — text is likely invisible on a light surface'
      );
    }
  }

  return bugs;
}

export function isParseable(content: string, filePath: string): boolean {
  if (!filePath.match(/\.(tsx?|jsx?)$/)) return true;
  try {
    babelParse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: false,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Asks the AI to repair broken TSX. Returns the repaired content if it
 * parses cleanly, otherwise null. One-shot — no retry loops here, since the
 * caller (generateComponents) drops unrepairable files entirely.
 */
export async function repairWithAI(content: string, filePath: string): Promise<string | null> {
  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 12000,
      thinking: { type: 'disabled' },
      system:
        'You repair broken React/TSX files. Return ONLY a single fenced code block ' +
        'containing the fixed file content. No prose, no explanation, no extra blocks.',
      messages: [
        {
          role: 'user',
          content:
            `The file \`${filePath}\` below has a syntax error. Return the corrected ` +
            'TSX so it parses cleanly. Preserve all working logic, JSX, props, and ' +
            'styling. Only fix the syntax. Use a fenced code block:\n\n' +
            '```tsx\n' + content + '\n```',
        },
      ],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return null;
    const match = textBlock.text.match(/```(?:tsx?|jsx?)?\s*\n([\s\S]*?)```/);
    const repaired = match ? match[1].trimEnd() : null;
    if (!repaired) return null;
    return isParseable(repaired, filePath) ? repaired : null;
  } catch {
    return null;
  }
}

/**
 * Asks the AI to fix shadeless brand-color classes (e.g. `from-primary`)
 * by adding the missing shade number. Returns the repaired content if it
 * now passes both isParseable and findShadelessBrandColors, otherwise null.
 */
export async function repairShadelessColors(
  content: string,
  filePath: string,
  bugs: string[]
): Promise<string | null> {
  if (bugs.length === 0) return content;
  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 12000,
      thinking: { type: 'disabled' },
      system:
        'You fix Tailwind shadeless-color bugs in React/TSX files. Return ONLY a single ' +
        'fenced code block containing the fixed file content. No prose, no explanation, ' +
        'no extra blocks.',
      messages: [
        {
          role: 'user',
          content:
            `The file \`${filePath}\` uses Tailwind brand-color classes WITHOUT shade numbers. ` +
            'These are invalid — Tailwind requires a shade like -500 or -700. The result ' +
            'is invisible text, blank gradients, or missing backgrounds.\n\n' +
            'Rules for the fix:\n' +
            '- text-primary → text-primary-700 (or 800/900 for headings)\n' +
            '- bg-primary → bg-primary-600\n' +
            '- from-primary / via-primary / to-primary → add -500 or -600 shades for visible gradients\n' +
            '- border-primary → border-primary-600\n' +
            '- Same pattern for secondary, accent, neutral.\n' +
            '- Pick shades that produce visible contrast: dark shades (700-900) for text on light bg, ' +
            'light shades (50-200) for backgrounds, mid shades (500-600) for buttons/accents.\n' +
            '- Preserve all other styling, JSX, layout, and logic exactly.\n\n' +
            'Detected violations:\n' + bugs.map((b) => `- ${b}`).join('\n') + '\n\n' +
            'File:\n```tsx\n' + content + '\n```',
        },
      ],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return null;
    const match = textBlock.text.match(/```(?:tsx?|jsx?)?\s*\n([\s\S]*?)```/);
    const repaired = match ? match[1].trimEnd() : null;
    if (!repaired) return null;
    if (!isParseable(repaired, filePath)) return null;
    return findShadelessBrandColors(repaired).length === 0 ? repaired : null;
  } catch {
    return null;
  }
}

/**
 * Asks the AI to fix contrast bugs (light text on light bg, dark text on
 * dark bg) on the same element. Returns the repaired content if it now
 * passes both isParseable and findContrastBugs, otherwise null. Caller
 * should keep the original on null and let the prompt-level rules be the
 * remaining safety net.
 */
export async function repairContrastWithAI(
  content: string,
  filePath: string,
  bugs: string[]
): Promise<string | null> {
  if (bugs.length === 0) return content;
  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 12000,
      thinking: { type: 'disabled' },
      system:
        'You fix Tailwind contrast bugs in React/TSX files. Return ONLY a single ' +
        'fenced code block containing the fixed file content. No prose, no ' +
        'explanation, no extra code blocks.',
      messages: [
        {
          role: 'user',
          content:
            `The file \`${filePath}\` has contrast bugs — text colors that are unreadable ` +
            'against their background. Fix ONLY the affected className values.\n\n' +
            'Rules:\n' +
            '- On light backgrounds (bg-white, bg-*-50, bg-*-100, bg-gray-50, bg-gray-100, bg-gray-200): ' +
            'text MUST be dark (text-gray-900, text-gray-800, text-gray-700, text-primary-900, text-neutral-900). ' +
            'NEVER text-white or text-gray-200 or text-*-100.\n' +
            '- On dark backgrounds (bg-black, bg-*-900, bg-*-950, bg-gray-800/900/950): ' +
            'text MUST be light (text-white, text-gray-100, text-gray-200, text-*-50, text-*-100). ' +
            'NEVER text-gray-900 or text-black.\n' +
            '- Preserve all other styling, JSX, layout, and logic exactly.\n\n' +
            'Detected violations:\n' + bugs.map((b) => `- ${b}`).join('\n') + '\n\n' +
            'File:\n```tsx\n' + content + '\n```',
        },
      ],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return null;
    const match = textBlock.text.match(/```(?:tsx?|jsx?)?\s*\n([\s\S]*?)```/);
    const repaired = match ? match[1].trimEnd() : null;
    if (!repaired) return null;
    if (!isParseable(repaired, filePath)) return null;
    return findContrastBugs(repaired).length === 0 ? repaired : null;
  } catch {
    return null;
  }
}

/**
 * Basic syntax sanity check for generated TSX/JSX/TS files.
 * Returns null if OK, or an error description if issues are found.
 */
function checkBasicSyntax(content: string, filePath: string): string | null {
  if (!filePath.match(/\.(tsx?|jsx?)$/)) return null;

  let braces = 0, parens = 0, brackets = 0;
  let inString: string | null = null;
  let inTemplate = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const prev = i > 0 ? content[i - 1] : '';

    // Skip escaped characters
    if (prev === '\\') continue;

    // String tracking
    if (!inString && !inTemplate) {
      if (ch === '"' || ch === "'") { inString = ch; continue; }
      if (ch === '`') { inTemplate = true; continue; }
    } else if (inString && ch === inString) {
      inString = null; continue;
    } else if (inTemplate && ch === '`' && prev !== '\\') {
      inTemplate = false; continue;
    }

    if (inString || inTemplate) continue;

    // Count delimiters
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '(') parens++;
    else if (ch === ')') parens--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }

  const issues: string[] = [];
  if (braces !== 0) issues.push(`unmatched braces (${braces > 0 ? 'missing }' : 'extra }'})`);
  if (parens !== 0) issues.push(`unmatched parentheses (${parens > 0 ? 'missing )' : 'extra )'})`);
  if (brackets !== 0) issues.push(`unmatched brackets (${brackets > 0 ? 'missing ]' : 'extra ]'})`);

  // Check for missing export default
  if (filePath.match(/\.(tsx|jsx)$/) && !content.includes('export default') && !content.includes('export function') && !content.includes('export const')) {
    issues.push('missing export');
  }

  return issues.length > 0 ? issues.join(', ') : null;
}

/**
 * Attempt basic auto-fix of common syntax issues in generated code.
 */
function autoFixSyntax(content: string): string {
  let fixed = content;

  // Fix duplicate tokens: [] [], '' '', {} {}
  fixed = fixed.replace(/\[\]\s*\[\]/g, '[]');
  fixed = fixed.replace(/''\s*''/g, "''");
  fixed = fixed.replace(/""\s*""/g, '""');
  fixed = fixed.replace(/\{\}\s*\{\}/g, '{}');

  // Fix truncated/incomplete function bodies at end of file
  // If file ends with incomplete code after last complete component, trim it
  const lastExportMatch = fixed.lastIndexOf('export default');
  if (lastExportMatch === -1) {
    // No default export — check if there's a named export we can use
    const namedExport = fixed.match(/export\s+(const|function)\s+(\w+)/);
    if (namedExport && !fixed.includes('export default')) {
      fixed += `\nexport default ${namedExport[2]};`;
    }
  }

  // Fix missing semicolons after import statements
  fixed = fixed.replace(/^(import\s+.+from\s+['"][^'"]+['"])\s*$/gm, '$1;');

  // Fix JSX: missing commas between props on same line
  // e.g., className="foo" onClick={bar} → className="foo" onClick={bar} (already valid JSX, no comma needed)

  // Fix duplicate 'use client' declarations
  const useClientCount = (fixed.match(/'use client';/g) || []).length;
  if (useClientCount > 1) {
    let found = false;
    fixed = fixed.replace(/'use client';\n?/g, (match) => {
      if (!found) { found = true; return match; }
      return '';
    });
  }

  // Fix missing closing parentheses for JSX returns
  let parens = 0;
  let inString: string | null = null;
  let inTemplate = false;
  for (let i = 0; i < fixed.length; i++) {
    const ch = fixed[i];
    if (i > 0 && fixed[i - 1] === '\\') continue;
    if (!inString && ch === '`') { inTemplate = !inTemplate; continue; }
    if (inTemplate) continue;
    if (!inString && (ch === '"' || ch === "'")) { inString = ch; continue; }
    if (inString && ch === inString) { inString = null; continue; }
    if (inString) continue;
    if (ch === '(') parens++;
    if (ch === ')') parens--;
  }
  while (parens > 0) {
    fixed += '\n)';
    parens--;
  }

  // Fix missing closing braces
  let braces = 0;
  inString = null;
  inTemplate = false;
  for (let i = 0; i < fixed.length; i++) {
    const ch = fixed[i];
    if (i > 0 && fixed[i - 1] === '\\') continue;
    if (!inString && ch === '`') { inTemplate = !inTemplate; continue; }
    if (inTemplate) continue;
    if (!inString && (ch === '"' || ch === "'")) { inString = ch; continue; }
    if (inString && ch === inString) { inString = null; continue; }
    if (inString) continue;
    if (ch === '{') braces++;
    if (ch === '}') braces--;
  }
  while (braces > 0) {
    fixed += '\n}';
    braces--;
  }

  // Fix trailing content after the component's closing — sometimes the AI 
  // generates extra incomplete code after the main component export.
  // Look for the pattern: } followed by 'use client' (start of duplicate component)
  const duplicateStart = fixed.indexOf("\n'use client'", fixed.indexOf("'use client'") + 1);
  if (duplicateStart > 0) {
    // Check if the code before this point has balanced braces
    const beforeDuplicate = fixed.substring(0, duplicateStart);
    let b = 0;
    for (const ch of beforeDuplicate) {
      if (ch === '{') b++;
      if (ch === '}') b--;
    }
    if (b <= 0) {
      // Braces are balanced before the duplicate — safe to trim
      fixed = beforeDuplicate;
      console.log('[autoFixSyntax] Trimmed duplicate component code');
    }
  }

  // Remove any trailing whitespace/newlines then ensure single newline at end
  fixed = fixed.trimEnd() + '\n';

  return fixed;
}

/**
 * Streams component generation from Claude. Yields GenerationEvents as
 * components are being streamed and completed.
 */
async function* generateComponents(
  config: GenerationConfig,
  designSystem: DesignSystem,
  blueprint: PageBlueprint,
  referenceBrief: DesignReferenceBrief,
  finalVariety: DesignVariety,
  artDirection: ArtDirectionContract
): AsyncGenerator<GenerationEvent & { _files?: Array<{ path: string; content: string; type: VirtualFile['type'] }> }> {
  const promptBuilder = getPromptBuilder(config.siteType);

  const varietyInstructions = buildVarietyInstructions(finalVariety);
  const model = resolveModelConfig(config.modelTier);

  const systemPrompt = buildSystemPrompt(designSystem);
  // Inject variety instructions into the user prompt so each site gets unique
  // layouts, then the verified image gallery LAST — its hard image rules must
  // outrank everything else, including user creative direction.
  const baseUserPrompt = promptBuilder(config);
  const galleryBlock = buildGalleryPromptBlock(
    config.business.industry,
    config.business.description
  );

  // Colour and motion are decided here, deterministically, rather than left to
  // the model's defaults (white sections, one fade-up). Both blocks sit late in
  // the prompt — after the generic guidance it would otherwise regress toward —
  // but still ahead of the user's verbatim direction and the image rules, which
  // must outrank everything.
  const homeSectionCount =
    blueprint.pages.find((page) => page.path === '/')?.sections.length ?? 12;
  const color = createColorContract(
    config,
    designSystem,
    finalVariety,
    artDirection.positioning,
    homeSectionCount
  );
  const colorScheme = color.schemeName;
  const colorContract = formatColorContract(color);
  const motion = createMotionContract(config, finalVariety, artDirection.positioning);
  const motionContract = formatMotionContract(motion);

  const userPrompt = `${baseUserPrompt}\n${buildTierExecutionBrief(model)}\n${formatDesignReferenceBrief(referenceBrief)}\n${formatArtDirectionContract(artDirection, blueprint)}\n${varietyInstructions}\n${colorContract}\n${motionContract}\n${buildSectionKitPromptBlock()}\n${buildCreativeDirectionOverride(config)}\n${galleryBlock}`;

  // Generation-scoped image tracking: enforces the "no image reused across
  // sections" rule from the gallery block deterministically.
  const galleryCtx = createGalleryContext(
    getIndustryGallery(config.business.industry, config.business.description)
  );

  // Track expected components from blueprint
  const expectedComponents = new Set<string>();
  for (const page of blueprint.pages) {
    for (const section of page.sections) {
      expectedComponents.add(section.componentName);
    }
  }
  for (const shared of blueprint.sharedComponents) {
    expectedComponents.add(shared);
  }

  const totalExpected = expectedComponents.size + blueprint.pages.length; // components + page files

  yield {
    type: 'stage-start',
    stage: 'components',
    totalFiles: totalExpected,
    completedFiles: 0,
  };

  // Stream through the selected provider. Power Mode receives Opus 5's
  // deeper reasoning budget; Standard preserves a faster, lower-cost pass.
  const stream = streamGenerationText(
    model,
    systemPrompt,
    userPrompt,
    model.reasoningEffort === 'max' ? model.maxTokens : TOKEN_LIMITS.component,
    {
      // High effort gives Opus 5 room to reason about a complex build while
      // keeping generation time and token cost bounded for an interactive
      // customer-facing request.
      reasoningEffort: model.reasoningEffort === 'max' ? 'high' : model.reasoningEffort,
    },
  );

  let buffer = '';
  let completedCount = 0;
  const allFiles: Array<{ path: string; content: string; type: VirtualFile['type'] }> = [];
  const seenFiles = new Set<string>();

  // Track what component we're currently streaming
  let currentComponent: string | null = null;

  for await (const chunk of stream) {
      buffer += chunk;

      // Detect if we're starting a new component file
      const headerMatch = chunk.match(/```\w+:([^\n]+)/);
      if (headerMatch) {
        const filePath = headerMatch[1].trim().replace(/^\.\//, '');
        const componentName = extractComponentName(filePath);
        if (componentName && componentName !== currentComponent) {
          currentComponent = componentName;
          yield {
            type: 'component-start',
            stage: 'components',
            componentName: currentComponent,
          };
        }
      }

      // Yield streaming chunks for real-time display
      if (currentComponent) {
        yield {
          type: 'component-chunk',
          stage: 'components',
          componentName: currentComponent,
          chunk,
        };
      }

      // Check for completed code blocks
      const { blocks, remaining } = extractCompletedBlocks(buffer);
      buffer = remaining;

      for (const block of blocks) {
        if (seenFiles.has(block.filePath)) continue;
        seenFiles.add(block.filePath);

        completedCount++;
        const fileType = inferFileType(block.filePath);

        // Auto-fix common syntax issues, then validate with the real parser.
        // If still broken, ask the AI to repair. If even that fails, drop the
        // file so the preview never has to render broken code.
        let content = block.content;
        const syntaxIssue = checkBasicSyntax(content, block.filePath);
        if (syntaxIssue) {
          content = autoFixSyntax(content);
        }
        if (!isParseable(content, block.filePath)) {
          const repaired = await repairWithAI(content, block.filePath);
          if (repaired) {
            content = repaired;
          } else {
            // Unrepairable — skip this file entirely.
            completedCount--;
            currentComponent = null;
            continue;
          }
        }

        // Contrast guard: scan for light-on-light / dark-on-dark and ask the
        // AI to fix any matches. If repair fails, ship the original — the
        // prompt-level rules already discourage these patterns and a broken
        // section is better than a missing section.
        const shadelessBugs = findShadelessBrandColors(content);
        if (shadelessBugs.length > 0) {
          const fixed = await repairShadelessColors(content, block.filePath, shadelessBugs);
          if (fixed) content = fixed;
        }
        const contrastBugs = findContrastBugs(content);
        if (contrastBugs.length > 0) {
          const fixed = await repairContrastWithAI(content, block.filePath, contrastBugs);
          if (fixed) content = fixed;
        }

        // Dead Unsplash IDs render as blank boxes — verify and swap them.
        // The gallery context also enforces cross-section image uniqueness.
        content = await repairDeadImageUrls(content, galleryCtx);

        allFiles.push({
          path: block.filePath,
          content,
          type: fileType,
        });

        const componentName = extractComponentName(block.filePath);
        yield {
          type: 'component-complete',
          stage: 'components',
          componentName: componentName ?? block.filePath,
          file: { path: block.filePath, content },
          totalFiles: totalExpected,
          completedFiles: completedCount,
        };

        currentComponent = null;
      }
  }

  // Process any remaining buffer content
  if (buffer.trim()) {
    const { blocks } = extractCompletedBlocks(buffer + '\n```');
    for (const block of blocks) {
      if (seenFiles.has(block.filePath)) continue;
      seenFiles.add(block.filePath);

      completedCount++;
      const fileType = inferFileType(block.filePath);

      // Auto-fix, validate, repair, or drop — same flow as the streaming path.
      let content = block.content;
      const syntaxIssue = checkBasicSyntax(content, block.filePath);
      if (syntaxIssue) {
        content = autoFixSyntax(content);
      }
      if (!isParseable(content, block.filePath)) {
        const repaired = await repairWithAI(content, block.filePath);
        if (repaired) {
          content = repaired;
        } else {
          completedCount--;
          continue;
        }
      }

      const shadelessBugs = findShadelessBrandColors(content);
      if (shadelessBugs.length > 0) {
        const fixed = await repairShadelessColors(content, block.filePath, shadelessBugs);
        if (fixed) content = fixed;
      }
      const contrastBugs = findContrastBugs(content);
      if (contrastBugs.length > 0) {
        const fixed = await repairContrastWithAI(content, block.filePath, contrastBugs);
        if (fixed) content = fixed;
      }

      // Dead Unsplash IDs render as blank boxes — verify and swap them.
      content = await repairDeadImageUrls(content, galleryCtx);

      allFiles.push({
        path: block.filePath,
        content,
        type: fileType,
      });

      const componentName = extractComponentName(block.filePath);
      yield {
        type: 'component-complete',
        stage: 'components',
        componentName: componentName ?? block.filePath,
        file: { path: block.filePath, content },
        totalFiles: totalExpected,
        completedFiles: completedCount,
      };
    }
  }

  // Deterministic divider pass: the model ignores prompt mandates for
  // section dividers, so — image-guard style — we inject them in code after
  // all files exist. The link-guard then rewrites any internal href that
  // points at a route this generation never produced (non-technical owners
  // judge the whole product by one dead button). Changed pages are re-yielded
  // as component-complete events so the client store and DB persistence pick
  // up the final content.
  const beforeInjection = new Map(allFiles.map((f) => [f.path, f.content]));
  const dividerResult = injectSectionDividers(allFiles);
  const linkResult = enforceLinkIntegrity(dividerResult.files);
  const runtimeResult = injectLayoutRuntimes(linkResult.files);
  const bookingResult = injectBookingForm(runtimeResult.files);
  allFiles.length = 0;
  allFiles.push(...bookingResult.files);

  // A cheap, deterministic guard for the unmistakable AI-template failure
  // modes. We don't spend a second full generation by default; severe results
  // are logged with concrete diagnostics so the next targeted edit can repair
  // only the missing art direction rather than rebuilding the entire site.
  // Contact details the model invented are replaced before the gate scores
  // anything. Prompt instructions did not stop this across three builds; a
  // phone number is a slot the design demands, so it gets filled correctly
  // here rather than asked for politely upstream.
  //
  // Wrapped because a generation that completed is worth more than a perfect
  // scrub: if this throws, the site still ships.
  try {
    const scrubbed = scrubFabricatedContacts(
      allFiles,
      // GenerationConfig carries no phone, email or address -- the owner fills
      // those into business_info later, from the dashboard. So at generation
      // time there is no real contact detail to preserve, and every number on
      // the page is invented by definition. Placeholders it is; publish-time
      // substitution can fill them once business_info exists.
      { phone: null, email: null, address: null },
      [config.business?.name, config.business?.tagline, config.business?.description]
        .filter(Boolean)
        .join(' ')
    );
    if (scrubbed.changes.length > 0) {
      console.warn('[fabrication-scrub]', { edits: scrubbed.changes.length, changes: scrubbed.changes.slice(0, 10) });

      // Files are written to generated_files as component-complete events
      // arrive, so mutating this array alone changed nothing that was saved --
      // the first run of this pass edited an in-memory copy of rows already on
      // disk. Changed files have to be re-emitted, which the route treats as
      // an update to the existing row, exactly as the booking injector does.
      const previous = new Map(allFiles.map((file) => [file.path, file.content]));
      allFiles.length = 0;
      allFiles.push(...scrubbed.files);

      for (const file of allFiles) {
        if (previous.get(file.path) === file.content) continue;
        yield {
          type: 'component-complete',
          stage: 'components',
          componentName: extractComponentName(file.path) ?? file.path,
          file: { path: file.path, content: file.content },
          totalFiles: totalExpected,
          completedFiles: completedCount,
        };
      }
    }
  } catch (scrubError) {
    console.error('[fabrication-scrub] skipped:', scrubError);
  }

  // Formulaic headings get the same treatment as invented contact details, and
  // for the same reason: the prompt ban bends the distribution but does not
  // hold. Four builds from one brief produced 1, 0, 0 and 2 formula hits.
  //
  // Re-emitting is not optional -- rows are written as component-complete
  // events arrive, so a pass that only mutates this array changes nothing that
  // was saved.
  try {
    const headings = scrubFormulaicHeadings(
      allFiles,
      artDirection.industry,
      config.business?.name || ''
    );
    if (headings.changes.length > 0) {
      console.warn('[heading-scrub]', { edits: headings.changes.length, changes: headings.changes.slice(0, 10) });
      const previousHeadings = new Map(allFiles.map((file) => [file.path, file.content]));
      allFiles.length = 0;
      allFiles.push(...headings.files);

      for (const file of allFiles) {
        if (previousHeadings.get(file.path) === file.content) continue;
        yield {
          type: 'component-complete',
          stage: 'components',
          componentName: extractComponentName(file.path) ?? file.path,
          file: { path: file.path, content: file.content },
          totalFiles: totalExpected,
          completedFiles: completedCount,
        };
      }
    }
  } catch (headingError) {
    console.error('[heading-scrub] skipped:', headingError);
  }

  const quality = evaluateDesignQuality(allFiles, artDirection, {
    requiredDeviceId: motion.signatureDevice.id,
    // Everything the owner actually told us. Anything concrete on the site
    // that is not in here was invented by the model.
    knownFacts: [
      config.business?.name,
      config.business?.tagline,
      config.business?.description,
      config.business?.industry,
    ]
      .filter(Boolean)
      .join(' '),
  });
  if (quality.issues.length > 0) {
    console.warn('[design-quality-gate]', {
      score: quality.score,
      severe: quality.severe,
      industry: artDirection.industry,
      scheme: colorScheme,
      motion: motion.personality,
      device: motion.signatureDevice.id,
      issues: quality.issues,
    });
  }

  // The gate used to stop at that console.warn and throw the score away, which
  // meant every failure it found shipped anyway. The copy formulas it now
  // catches are exactly the kind a targeted rewrite fixes cheaply, so the
  // findings are carried out of the pipeline instead of being swallowed.
  yield {
    type: 'quality-report',
    stage: 'components',
    score: quality.score,
    severe: quality.severe,
    issues: quality.issues,
    totalFiles: totalExpected,
    completedFiles: completedCount,
  };
  for (const file of bookingResult.files) {
    if (beforeInjection.get(file.path) === file.content) continue;
    const componentName = extractComponentName(file.path);
    yield {
      type: 'component-complete',
      stage: 'components',
      componentName: componentName ?? file.path,
      file: { path: file.path, content: file.content },
      totalFiles: totalExpected,
      completedFiles: completedCount,
    };
  }

  // Attach all files to the final event for assembly
  yield {
    type: 'stage-complete',
    stage: 'components',
    totalFiles: completedCount,
    completedFiles: completedCount,
    _files: allFiles,
  };
}

// --------------------------------------------------------------------------
// Stage 5: Assemble Project
// --------------------------------------------------------------------------

/**
 * Combines deterministic scaffolding files with AI-generated components
 * into a complete VirtualFileTree. Yields component-complete events for
 * each scaffold file so they flow through the same event system and get
 * persisted to the database alongside AI-generated files.
 */
async function* assembleProject(
  config: GenerationConfig,
  designSystem: DesignSystem,
  generatedFiles: Array<{ path: string; content: string; type: VirtualFile['type'] }>
): AsyncGenerator<GenerationEvent> {
  const tree = new VirtualFileTree();

  // Deterministic scaffolding files -- yield each as a component-complete event
  const scaffoldFiles: Array<{ path: string; content: string; type: VirtualFile['type'] }> = [
    { path: 'package.json', content: generatePackageJson(config), type: 'config' },
    { path: 'next.config.js', content: generateNextConfig(), type: 'config' },
    { path: 'tsconfig.json', content: generateTsConfig(), type: 'config' },
    { path: 'tailwind.config.js', content: generateTailwindConfig(designSystem), type: 'config' },
    {
      path: 'postcss.config.js',
      content: `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n`,
      type: 'config',
    },
    {
      path: 'src/lib/design-system.json',
      content: JSON.stringify(designSystem, null, 2),
      type: 'data',
    },
    // SEO layer: robots + sitemap metadata routes and JSON-LD schema component
    { path: 'src/app/robots.ts', content: generateRobotsTs(config), type: 'config' },
    { path: 'src/app/sitemap.ts', content: generateSitemapTs(config), type: 'config' },
    {
      path: 'src/components/SeoSchema.tsx',
      content: generateSeoSchemaComponent(config),
      type: 'component',
    },
    // Divider component referenced by the injected <SectionDivider /> usages
    // (see divider-injector.ts) — shipped with every site so injected pages
    // always resolve their import.
    {
      path: 'src/components/SectionDivider.tsx',
      content: generateSectionDividerComponent(),
      type: 'component',
    },
    // Scroll dynamics runtime referenced by the injected layout usage (see
    // injectLayoutRuntimes) — parallax, stat count-ups, and a brand-colored
    // scroll progress bar on every site, deterministically.
    {
      path: 'src/components/DynamicsRuntime.tsx',
      content: generateDynamicsRuntimeComponent(
        designSystem.colors.primary['500'],
        designSystem.colors.accent['500'],
        pickSiteMotion(config.business.name, config.business.description)
      ),
      type: 'component',
    },
    // Booking form referenced by the injected <BookingForm /> usage (see
    // booking-injector) — every site gets a working booking flow wired to the
    // real endpoint, instead of whatever contact form the model improvised.
    {
      path: 'src/components/BookingForm.tsx',
      content: generateBookingFormComponent(
        deriveBookingOptions(config.siteType, config.business.industry)
      ),
      type: 'component' as const,
    },
    // Pre-built premium sections. The model chooses which to use and writes the
    // content; it never re-implements the layout.
    ...generateSectionKitFiles().map((file) => ({
      path: file.path,
      content: file.content,
      type: 'component' as const,
    })),
  ];

  for (const file of scaffoldFiles) {
    tree.addFile(file.path, file.content, file.type);
    yield {
      type: 'component-complete',
      stage: 'assembly',
      componentName: file.path,
      file: { path: file.path, content: file.content },
    };
  }

  // Add all AI-generated files
  for (const file of generatedFiles) {
    tree.addFile(file.path, file.content, file.type);
  }
}

function buildCreativeDirectionOverride(config: GenerationConfig): string {
  if (!config.aiPrompt?.trim()) return '';

  return `
=== USER CREATIVE DIRECTION — HIGHEST PRIORITY ===
The user's own prompt is the strongest design brief. If any generated default,
industry template, or design-variety instruction conflicts with it, follow the
user's prompt.

User prompt:
${config.aiPrompt}

Before writing code, silently extract hard constraints from the user prompt:
- required pages and navigation labels
- requested mood, color, typography, and layout references
- explicit negative constraints such as "no icon grids" or "no cards"
- imagery requirements such as full-bleed photography, product photos, food photos, or portraits

Honor those constraints literally in the generated code. Do not let the default
site-type template add unrelated sections, generic service cards, emergency
banners, or local-trade trust badges unless they fit the business and the user
asked for them.
`;
}

// --------------------------------------------------------------------------
// Main Pipeline Orchestrator
// --------------------------------------------------------------------------

/**
 * Runs the full 5-stage generation pipeline, yielding GenerationEvents
 * at each step for real-time progress tracking.
 *
 * Usage:
 * ```ts
 * for await (const event of runGenerationPipeline(config)) {
 *   // stream to client via SSE, update UI, etc.
 * }
 * ```
 */
export async function* runGenerationPipeline(
  config: GenerationConfig
): AsyncGenerator<GenerationEvent> {
  let designSystem: DesignSystem;
  let blueprint: PageBlueprint;
  let referenceBrief: DesignReferenceBrief;
  let designVariety: DesignVariety;
  let artDirection: ArtDirectionContract;
  let generatedFiles: Array<{ path: string; content: string; type: VirtualFile['type'] }> = [];

  // ── Stage 1: Config Assembly ──────────────────────────────────────────
  yield { type: 'stage-start', stage: 'config-assembly' };

  try {
    config = assembleConfig(config);
    const research = createDesignReferenceBrief(config);
    referenceBrief = research.brief;
    designVariety = research.variety;
    artDirection = createArtDirectionContract(config, designVariety);
  } catch (err) {
    yield {
      type: 'error',
      stage: 'config-assembly',
      error: `Config assembly failed: ${err instanceof Error ? err.message : String(err)}`,
    };
    return;
  }

  yield { type: 'stage-complete', stage: 'config-assembly' };

  // ── Stage 2: Design System Generation ─────────────────────────────────
  yield { type: 'stage-start', stage: 'design-system' };

  try {
    designSystem = await generateDesignSystem(config, referenceBrief);
  } catch (err) {
    yield {
      type: 'error',
      stage: 'design-system',
      error: `Design system generation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
    return;
  }

  yield { type: 'stage-complete', stage: 'design-system' };

  // ── Stage 3: Blueprint Generation ─────────────────────────────────────
  yield { type: 'stage-start', stage: 'blueprint' };

  try {
    blueprint = await generateBlueprint(config, designSystem, referenceBrief, artDirection);
  } catch (err) {
    yield {
      type: 'error',
      stage: 'blueprint',
      error: `Blueprint generation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
    return;
  }

  yield { type: 'stage-complete', stage: 'blueprint' };

  // ── Stage 4: Component Generation (streaming) ─────────────────────────
  try {
    for await (const event of generateComponents(
      config,
      designSystem,
      blueprint,
      referenceBrief,
      designVariety,
      artDirection
    )) {
      // Collect generated files from the internal _files property
      const { _files: internalFiles, ...publicEvent } = event;
      if (internalFiles) {
        generatedFiles = internalFiles;
      }

      // Strip internal property before yielding to consumers
      yield publicEvent;
    }
  } catch (err) {
    yield {
      type: 'error',
      stage: 'components',
      error: `Component generation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
    return;
  }

  // ── Stage 5: Project Assembly ─────────────────────────────────────────
  yield { type: 'stage-start', stage: 'assembly' };

  let scaffoldCount = 0;
  try {
    for await (const event of assembleProject(config, designSystem, generatedFiles)) {
      scaffoldCount++;
      yield event;
    }
  } catch (err) {
    yield {
      type: 'error',
      stage: 'assembly',
      error: `Project assembly failed: ${err instanceof Error ? err.message : String(err)}`,
    };
    return;
  }

  yield { type: 'stage-complete', stage: 'assembly' };

  // ── Done ──────────────────────────────────────────────────────────────
  yield {
    type: 'generation-complete',
    stage: 'complete',
    totalFiles: generatedFiles.length + scaffoldCount,
  };
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/**
 * Extracts a human-friendly component name from a file path.
 * E.g. "src/components/Hero.tsx" -> "Hero"
 */
function extractComponentName(filePath: string): string | null {
  const match = filePath.match(/\/([^/]+)\.(tsx?|jsx?|css)$/);
  if (!match) return null;

  const name = match[1];
  // Return the name if it looks like a component (PascalCase) or page
  return name;
}

/**
 * Infers the VirtualFile type from the file path.
 */
function inferFileType(filePath: string): VirtualFile['type'] {
  if (filePath.includes('/app/') && filePath.endsWith('page.tsx')) return 'page';
  if (filePath.includes('/app/') && filePath.endsWith('layout.tsx')) return 'page';
  if (filePath.endsWith('.css')) return 'style';
  if (filePath.endsWith('.json')) return 'config';
  if (filePath.includes('/data/') || filePath.includes('/lib/')) return 'data';
  return 'component';
}

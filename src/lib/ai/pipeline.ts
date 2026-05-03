import type { GenerationConfig, DesignSystem, PageBlueprint } from '@/types/project';
import type { GenerationEvent, VirtualFile } from '@/types/generation';
import { VirtualFileTree } from '@/types/generation';
import { parse as babelParse } from '@babel/parser';
import { getAnthropicClient, GENERATION_MODEL, TOKEN_LIMITS, withRetry } from './client';
import { type ModelTier, getModelConfig, DEFAULT_FREE_TIER } from './models';

// Resolve which Anthropic model ID to use based on tier (or fallback to default)
function resolveModel(tier?: ModelTier): string {
  if (!tier) return GENERATION_MODEL;
  const config = getModelConfig(tier);
  // For OpenRouter models, we still use Anthropic default in the pipeline
  // (OpenRouter integration happens at the API route level)
  if (config.provider === 'openrouter') return GENERATION_MODEL;
  return config.modelId;
}
import { buildSystemPrompt } from './prompts/system-prompt';
import { buildLandingPagePrompt } from './prompts/landing-page';
import { buildBusinessPortfolioPrompt } from './prompts/business-portfolio';
import { buildEcommercePrompt } from './prompts/ecommerce';
import { buildSaasPrompt } from './prompts/saas';
import { buildLocalServicePrompt } from './prompts/local-service';
import { parseDesignSystem, parseBlueprint, extractCompletedBlocks } from './parsers';
import { generateTailwindConfig } from '@/lib/templates/base/tailwind-config';
import { generatePackageJson } from '@/lib/templates/base/package-json';
import { generateNextConfig } from '@/lib/templates/base/next-config';
import { generateTsConfig } from '@/lib/templates/base/tsconfig';
import {
  getDesignVariety,
  buildVarietyInstructions,
  overrideVarietyWithUserChoices,
  getIndustryPaletteGuidance,
} from './design-variety';

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

async function generateDesignSystem(config: GenerationConfig): Promise<DesignSystem> {
  const client = getAnthropicClient();

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

  const userPrompt = `Generate a UNIQUE, distinctive design system for:
Business: "${config.business.name}" (${config.business.industry})
Description: ${config.business.description}
Style: ${config.branding.style}
Heading font: ${config.branding.fontHeading}
Body font: ${config.branding.fontBody}

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
  slate. The palette should feel deliberately chosen for THIS vertical.`;

  const response = await withRetry(() => client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: TOKEN_LIMITS.designSystem,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }));

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in design system response');
  }

  return parseDesignSystem(textBlock.text);
}

// --------------------------------------------------------------------------
// Stage 3: Generate Blueprint
// --------------------------------------------------------------------------

async function generateBlueprint(
  config: GenerationConfig,
  designSystem: DesignSystem
): Promise<PageBlueprint> {
  const client = getAnthropicClient();

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
- For SaaS sites, include dataRequirements for pricing/features data.`;

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
${config.ecommerce ? `E-commerce: ${config.ecommerce.products.length} products, cart ${config.ecommerce.cartEnabled ? 'enabled' : 'disabled'}` : ''}
${config.saas ? `SaaS: ${config.saas.features.length} features, ${config.saas.pricingTiers.length} pricing tiers, auth ${config.saas.hasAuth ? 'yes' : 'no'}, dashboard ${config.saas.hasDashboard ? 'yes' : 'no'}` : ''}`;

  const response = await withRetry(() => client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: TOKEN_LIMITS.blueprint,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }));

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in blueprint response');
  }

  return parseBlueprint(textBlock.text);
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

  const LIGHT_BG = /\bbg-(?:white|gray-(?:50|100|200)|slate-(?:50|100|200)|neutral-(?:50|100|200)|stone-(?:50|100|200)|zinc-(?:50|100|200)|\w+-(?:50|100))\b/;
  const LIGHT_TEXT = /\btext-(?:white|gray-(?:50|100|200|300)|slate-(?:50|100|200|300)|neutral-(?:50|100|200|300)|\w+-(?:50|100|200))\b/;
  const DARK_BG = /\bbg-(?:black|gray-(?:800|900|950)|slate-(?:800|900|950)|neutral-(?:800|900|950)|stone-(?:800|900|950)|zinc-(?:800|900|950)|\w+-(?:900|950))\b/;
  const DARK_TEXT = /\btext-(?:black|gray-(?:700|800|900|950)|slate-(?:700|800|900|950)|neutral-(?:700|800|900|950)|\w+-(?:800|900|950))\b/;

  for (const match of classMatches) {
    const cls = match[1];

    if (LIGHT_BG.test(cls) && LIGHT_TEXT.test(cls)) {
      bugs.push(`light text on light background — classes: "${cls.slice(0, 140)}"`);
    }
    if (DARK_BG.test(cls) && DARK_TEXT.test(cls)) {
      bugs.push(`dark text on dark background — classes: "${cls.slice(0, 140)}"`);
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
      max_tokens: 8000,
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
      max_tokens: 8000,
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
      max_tokens: 8000,
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
  blueprint: PageBlueprint
): AsyncGenerator<GenerationEvent & { _files?: Array<{ path: string; content: string; type: VirtualFile['type'] }> }> {
  const client = getAnthropicClient();
  const promptBuilder = getPromptBuilder(config.siteType);

  // Get unique design variety based on business identity
  const variety = getDesignVariety(
    config.business.name,
    config.business.industry,
    config.business.description
  );
  // Let user choices override auto-picked variety
  const finalVariety = overrideVarietyWithUserChoices(variety, config);
  const varietyInstructions = buildVarietyInstructions(finalVariety);

  const systemPrompt = buildSystemPrompt(designSystem);
  // Inject variety instructions into the user prompt so each site gets unique layouts
  const baseUserPrompt = promptBuilder(config);
  const userPrompt = `${baseUserPrompt}\n${varietyInstructions}`;

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

  // Use the Anthropic SDK streaming API
  const stream = client.messages.stream({
    model: GENERATION_MODEL,
    max_tokens: TOKEN_LIMITS.component,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  let buffer = '';
  let completedCount = 0;
  const allFiles: Array<{ path: string; content: string; type: VirtualFile['type'] }> = [];
  const seenFiles = new Set<string>();

  // Track what component we're currently streaming
  let currentComponent: string | null = null;

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      const chunk = event.delta.text;
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

      const contrastBugs = findContrastBugs(content);
      if (contrastBugs.length > 0) {
        const fixed = await repairContrastWithAI(content, block.filePath, contrastBugs);
        if (fixed) content = fixed;
      }

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
  let generatedFiles: Array<{ path: string; content: string; type: VirtualFile['type'] }> = [];

  // ── Stage 1: Config Assembly ──────────────────────────────────────────
  yield { type: 'stage-start', stage: 'config-assembly' };

  try {
    config = assembleConfig(config);
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
    designSystem = await generateDesignSystem(config);
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
    blueprint = await generateBlueprint(config, designSystem);
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
    for await (const event of generateComponents(config, designSystem, blueprint)) {
      // Collect generated files from the internal _files property
      if (event._files) {
        generatedFiles = event._files;
      }

      // Strip internal property before yielding to consumers
      const { _files, ...publicEvent } = event;
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

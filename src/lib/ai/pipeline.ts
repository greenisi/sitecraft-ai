import type { GenerationConfig, DesignSystem, PageBlueprint } from '@/types/project';
import type { GenerationEvent, VirtualFile } from '@/types/generation';
import { VirtualFileTree } from '@/types/generation';
import { getAnthropicClient, GENERATION_MODEL, TOKEN_LIMITS } from './client';
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

  const systemPrompt = `You are a design system expert. Given a business description and branding preferences, generate a comprehensive Tailwind CSS design system as a JSON object.

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

Generate color scales that harmonize with the provided brand colors. Each scale needs shades from 50 (lightest) through 950 (darkest). The provided hex colors should map to the 500 shade.`;

  const userPrompt = `Generate a design system for:
Business: "${config.business.name}" (${config.business.industry})
Style: ${config.branding.style}
Primary color: ${config.branding.primaryColor}
Secondary color: ${config.branding.secondaryColor}
Accent color: ${config.branding.accentColor}
Heading font: ${config.branding.fontHeading}
Body font: ${config.branding.fontBody}`;

  const response = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: TOKEN_LIMITS.designSystem,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

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

  const response = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: TOKEN_LIMITS.blueprint,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

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

  const systemPrompt = buildSystemPrompt(designSystem);
  const userPrompt = promptBuilder(config);

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

        allFiles.push({
          path: block.filePath,
          content: block.content,
          type: fileType,
        });

        const componentName = extractComponentName(block.filePath);
        yield {
          type: 'component-complete',
          stage: 'components',
          componentName: componentName ?? block.filePath,
          file: { path: block.filePath, content: block.content },
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

      allFiles.push({
        path: block.filePath,
        content: block.content,
        type: fileType,
      });

      const componentName = extractComponentName(block.filePath);
      yield {
        type: 'component-complete',
        stage: 'components',
        componentName: componentName ?? block.filePath,
        file: { path: block.filePath, content: block.content },
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

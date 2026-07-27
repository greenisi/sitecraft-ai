/**
 * Drives runGenerationPipeline directly (no credits deducted, no DB writes) to
 * validate the colour + motion contracts against real model output.
 * Writes generated files to the scratchpad for inspection.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { runGenerationPipeline } from '../src/lib/ai/pipeline';
import type { GenerationConfig } from '../src/types/project';

const OUT = process.env.GEN_OUT || '/private/tmp/gen-out';

const config = {
  siteType: 'local-service',
  modelTier: 'pro-build',
  business: {
    name: 'Thornhill & Vale',
    tagline: 'Landscape design and build',
    description:
      'Bespoke landscape design and build studio serving the Hudson Valley. Stone terraces, native planting schemes, and outdoor living rooms for period homes. Design-build-maintain.',
    industry: 'Landscaping',
    targetAudience: 'Homeowners of period properties planning a multi-season garden project',
  },
  branding: {
    primaryColor: '#4d7c4d',
    secondaryColor: '#8a6b3d',
    accentColor: '#c8811f',
    fontHeading: 'Fraunces',
    fontBody: 'Inter',
    style: 'modern',
  },
  sections: [
    { id: 'hero', type: 'hero', order: 0 },
    { id: 'services', type: 'features', order: 1 },
    { id: 'gallery', type: 'gallery', order: 2 },
    { id: 'about', type: 'about', order: 3 },
    { id: 'testimonials', type: 'testimonials', order: 4 },
    { id: 'cta', type: 'cta', order: 5 },
  ],
  navigation: {
    navbarStyle: 'light',
    navbarPosition: 'fixed',
    footerStyle: 'multi-column',
  },
  aiPrompt:
    'A design-build landscape studio serving the Hudson Valley. Serving Rhinebeck, Kingston, and Beacon. The experience should feel quiet, confident, and material-led. Show real project work and the seasons.',
} as unknown as GenerationConfig;

async function main() {
const started = Date.now();
const collected = new Map<string, string>();

for await (const event of runGenerationPipeline(config)) {
  if (event.type === 'stage-start') {
    console.log(`[${Math.round((Date.now() - started) / 1000)}s] → ${event.stage}`);
  }
  if (event.type === 'error') {
    console.error(`[ERROR] ${event.stage}: ${event.error}`);
  }
  if (event.type === 'component-complete' && event.file) {
    // Post-pass re-emits the same path with injected dividers/runtimes; the
    // last write is the final content.
    collected.set(event.file.path, event.file.content);
  }
  if (event.type === 'generation-complete') {
    for (const [path, content] of collected) {
      const target = join(OUT, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content, 'utf8');
    }
    console.log(`\nWROTE ${collected.size} files to ${OUT} (pipeline reported ${event.totalFiles})`);
  }
}

console.log(`\nDONE in ${Math.round((Date.now() - started) / 1000)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import assert from 'node:assert/strict';
import { buildSystemPrompt } from '../src/lib/ai/prompts/system-prompt';
import type { DesignSystem } from '../src/types/project';

const designSystem: DesignSystem = {
  colors: {
    primary: { '50': '#f0fdfa', '500': '#14b8a6', '900': '#134e4a' },
    secondary: { '50': '#f8fafc', '500': '#64748b', '900': '#0f172a' },
    accent: { '50': '#fff7ed', '500': '#f97316', '900': '#7c2d12' },
    neutral: { '50': '#fafafa', '500': '#737373', '900': '#171717' },
  },
  typography: {
    headingFont: 'Sora',
    bodyFont: 'Inter',
    scale: { base: { size: '1rem', lineHeight: '1.5rem', weight: '400' } },
  },
  spacing: { md: '1rem' },
  borderRadius: { lg: '0.5rem' },
  shadows: { md: '0 4px 12px rgba(0,0,0,.12)' },
};

const prompt = buildSystemPrompt(designSystem);

assert.match(prompt, /REFERENCE-LED ART DIRECTION/);
assert.match(prompt, /A logo is not optional/i);
assert.match(prompt, /inline SVG/i);
assert.match(prompt, /verified image gallery/i);
assert.match(prompt, /Never invent ratings, reviews, awards, certifications, years, guarantees, prices, customer counts, or statistics/i);
assert.doesNotMatch(prompt, /Use 6-8 high-quality Unsplash images per page minimum/i);
assert.doesNotMatch(prompt, /Include star ratings \(5 amber Star icons\) above every quote/i);
assert.doesNotMatch(prompt, /Pick stats that are concrete and ownable/i);
assert.doesNotMatch(prompt, /Trust indicators below hero CTAs: "Rated 4\.9\/5"/i);

console.log('PASS premium system prompt contract');

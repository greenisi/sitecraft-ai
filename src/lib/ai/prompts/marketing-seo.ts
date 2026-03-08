interface SeoPromptContext {
  businessName: string;
  industry?: string;
  description?: string;
  targetAudience?: string;
  siteType?: string;
  pages: string[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

export function buildSeoGenerationPrompt(context: SeoPromptContext): string {
  const locationStr = context.location
    ? [context.location.city, context.location.state, context.location.country].filter(Boolean).join(', ')
    : null;

  return `You are an expert SEO consultant. Generate optimized SEO metadata for a ${context.siteType || 'business'} website.

BUSINESS DETAILS:
- Name: ${context.businessName}
- Industry: ${context.industry || 'general business'}
- Description: ${context.description || 'N/A'}
- Target Audience: ${context.targetAudience || 'general consumers'}
${locationStr ? `- Location: ${locationStr}` : ''}

PAGES TO OPTIMIZE: ${JSON.stringify(context.pages)}

Return ONLY valid JSON with this structure:
{
  "pages": [
    {
      "page_path": "/",
      "meta_title": "string (50-60 chars, include business name and primary keyword)",
      "meta_description": "string (150-160 chars, compelling with CTA)",
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
      "og_title": "string",
      "og_description": "string",
      "schema_markup": { JSON-LD schema object }
    }
  ],
  "summary": "2-3 sentence explanation of the SEO strategy applied"
}

RULES:
- Meta titles: Primary keyword near beginning, brand name at end, separated by | or -
- Meta descriptions: Include a call-to-action, mention unique value prop, be compelling
- Keywords: 5-10 per page, mix head terms and long-tail phrases${locationStr ? `\n- Include local keywords with "${locationStr}" for local SEO` : ''}
- Schema markup: Use ${context.siteType === 'ecommerce' ? 'Product/Offer' : context.siteType === 'local-service' || context.siteType === 'service' ? 'LocalBusiness' : 'Organization'} as the primary schema type
- Each page MUST have unique metadata - never duplicate across pages
- Write for humans first, search engines second
- Keep language natural, not keyword-stuffed`;
}

export function buildSeoScoreSummaryPrompt(score: number, issues: string[]): string {
  return `Given an SEO score of ${score}/100 with these issues: ${JSON.stringify(issues)}, write a 2-sentence summary of the SEO health and the most important thing to fix first. Be encouraging but honest. Return just the text, no JSON.`;
}

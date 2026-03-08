interface AdCopyPromptContext {
  businessName: string;
  industry?: string;
  description?: string;
  targetAudience?: string;
  platforms: string[];
  services?: string[];
  products?: string[];
  websiteUrl?: string;
  budget?: string;
}

export function buildAdCopyPrompt(context: AdCopyPromptContext): string {
  const servicesStr = context.services?.length
    ? `\nSERVICES OFFERED: ${context.services.join(', ')}`
    : '';
  const productsStr = context.products?.length
    ? `\nPRODUCTS: ${context.products.join(', ')}`
    : '';
  const urlStr = context.websiteUrl ? `\nWEBSITE: ${context.websiteUrl}` : '';

  return `You are a performance marketing expert specializing in paid advertising for small businesses.

BUSINESS DETAILS:
- Name: ${context.businessName}
- Industry: ${context.industry || 'general business'}
- Description: ${context.description || 'N/A'}
- Target Audience: ${context.targetAudience || 'general consumers'}${servicesStr}${productsStr}${urlStr}

TASK: Generate ad copy variations for these platforms: ${context.platforms.join(', ')}

Create 3 ad variations per platform (different angles: benefit-driven, urgency, social proof).

Return ONLY valid JSON:
{
  "ads": [
    {
      "platform": "google_ads" | "meta_ads",
      "variation": "benefit" | "urgency" | "social_proof",
      "headlines": ["Headline 1 (max 30 chars)", "Headline 2 (max 30 chars)", "Headline 3 (max 30 chars)"],
      "descriptions": ["Description 1 (max 90 chars)", "Description 2 (max 90 chars)"],
      "cta": "Call to action text",
      "targeting_suggestion": "Brief audience targeting recommendation"
    }
  ],
  "summary": "Brief overview of the ad strategy and expected performance",
  "budget_suggestion": "Recommended daily budget range and allocation"
}

PLATFORM RULES:

Google Ads (Search):
- Headlines: Max 30 characters each, provide 3. Include keywords naturally.
- Descriptions: Max 90 characters each, provide 2. Include value prop and CTA.
- Focus on search intent — what would someone Google to find this business?
- Include the business name in at least one headline.
- Use power words: Free, Save, Best, Top, Get, Try, New

Meta Ads (Facebook/Instagram):
- Headlines: Max 40 characters, punchy and scroll-stopping.
- Descriptions: Max 125 characters, conversational and benefit-focused.
- Primary text (description 1): Hook + value prop
- Secondary text (description 2): Social proof or urgency element
- CTA should match the funnel stage (Learn More, Get Quote, Shop Now, Book Now)

AD COPY ANGLES:
1. Benefit-driven: Lead with the #1 benefit the customer gets. Answer "What's in it for me?"
2. Urgency: Create time-sensitivity or scarcity without being fake. Limited spots, seasonal relevance, etc.
3. Social proof: Reference customer satisfaction, years in business, number of customers served.

CRITICAL RULES:
- Write for the target audience, not the business owner
- Every headline must be under the character limit — count carefully
- Be specific — "Save 2 hours/week" beats "Save time"
- Never use ALL CAPS for entire headlines
- Each variation should feel different, not just reworded
- Include the business type/industry in targeting suggestions
- Make CTAs action-oriented and specific to the business`;
}

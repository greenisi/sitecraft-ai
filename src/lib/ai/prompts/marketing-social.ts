interface SocialPromptContext {
  businessName: string;
  industry?: string;
  description?: string;
  targetAudience?: string;
  platforms: string[];
  count: number;
  timeframe: string;
  services?: string[];
  products?: string[];
  brandColor?: string;
  websiteUrl?: string;
}

export function buildSocialPostsPrompt(context: SocialPromptContext): string {
  const servicesStr = context.services?.length
    ? `\nSERVICES OFFERED: ${context.services.join(', ')}`
    : '';
  const productsStr = context.products?.length
    ? `\nPRODUCTS: ${context.products.join(', ')}`
    : '';
  const brandColor = context.brandColor || 'orange';
  const urlStr = context.websiteUrl ? `\nWEBSITE: ${context.websiteUrl}` : '';

  return `You are a social media marketing expert creating content for a small business owner.

BUSINESS DETAILS:
- Name: ${context.businessName}
- Industry: ${context.industry || 'general business'}
- Description: ${context.description || 'N/A'}
- Target Audience: ${context.targetAudience || 'general consumers'}
- Brand Accent Color: ${brandColor}${servicesStr}${productsStr}${urlStr}

TASK: Generate ${context.count} social media posts for ${context.timeframe} across these platforms: ${context.platforms.join(', ')}

Return ONLY valid JSON:
{
  "posts": [
    {
      "platform": "instagram" | "facebook" | "x",
      "content": "The post text with appropriate length for the platform",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "image_suggestion": "Brief description of ideal image to accompany this post",
      "visual_headline": "Bold 3-6 word headline for the graphic (e.g., 'Grow Your Business Today')",
      "visual_subtext": "1 short supporting sentence for the graphic (max 15 words)",
      "post_type": "promotional" | "educational" | "engagement" | "behind-the-scenes" | "testimonial",
      "best_time": "Day and time suggestion (e.g., Tuesday 10am)"
    }
  ],
  "summary": "Brief overview of the content strategy for this ${context.timeframe}"
}

BRANDED GRAPHIC DESIGN RULES:
Each post includes a visual_headline and visual_subtext. These will be rendered on a branded social media graphic.
- visual_headline: Bold, punchy, 3-6 words. Think billboard — short and impactful. All title case.
- visual_subtext: Supporting detail or call-to-action, max 15 words. Complements the headline.
- The headlines should vary in approach: some benefit-driven, some question-based, some urgency-driven, some inspirational.
- Write for the GRAPHIC, not the caption — these go ON the image itself.
- Make each graphic headline unique and compelling on its own.
- Think of this like professional social media marketing graphics with bold text overlays on dark backgrounds with ${brandColor} accent colors.

PLATFORM RULES:
- Instagram: Visual-first, engaging captions, 15-20 relevant hashtags, use emojis naturally
- Facebook: Conversational tone, 2-3 hashtags max, include a question or CTA, keep under 250 chars for best engagement
- X (Twitter): Concise and punchy, 280 char max, 1-2 hashtags, make it shareable

CONTENT MIX:
- ~30% promotional (highlight services/products with value, not hard-sell)
- ~30% educational (tips, how-tos, industry insights)
- ~15% engagement (questions, polls, conversation starters)
- ~15% behind-the-scenes (humanize the brand, team, process)
- ~10% social proof (customer stories, results, testimonials)

CRITICAL RULES:
- Write like a real business owner, not a marketing agency
- Be authentic, warm, and specific to THIS business
- Never use generic corporate language
- Each post should standalone - don't reference other posts
- Vary the tone and format across posts
- Include specific details about the business services/products when relevant`;
}

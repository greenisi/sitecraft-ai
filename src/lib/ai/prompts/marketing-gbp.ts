interface GbpPromptContext {
  businessName: string;
  industry?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  services?: string[];
}

export function buildGoogleBusinessProfileGuide(context: GbpPromptContext): string {
  const locationStr = [context.city, context.state].filter(Boolean).join(', ');

  return `You are a local SEO expert helping a small business owner set up their Google Business Profile. Create a personalized, step-by-step guide.

BUSINESS DETAILS:
- Name: ${context.businessName}
- Industry: ${context.industry || 'general business'}
- Description: ${context.description || 'N/A'}
${context.address ? `- Address: ${context.address}` : ''}
${locationStr ? `- Location: ${locationStr}` : ''}
${context.phone ? `- Phone: ${context.phone}` : ''}
${context.website ? `- Website: ${context.website}` : ''}
${context.services?.length ? `- Services: ${context.services.join(', ')}` : ''}

Return ONLY valid JSON:
{
  "steps": [
    {
      "number": 1,
      "title": "Step title",
      "description": "2-3 sentences with specific instructions for this business",
      "tip": "Optional pro tip for better results"
    }
  ],
  "summary": "A friendly, formatted markdown guide the user can follow. Use ## headings, numbered lists, and bold for key actions. Keep it practical and encouraging."
}

REQUIRED STEPS (personalize each one):
1. Create or claim the Google Business Profile listing
2. Choose the right primary and secondary business categories for their ${context.industry || 'business'}
3. Add complete business information (NAP - name, address, phone)
4. Write a compelling business description
5. Upload photos (recommend specific photo types for ${context.industry || 'their industry'})
6. Set up services/products listing
7. Get first reviews (suggest how to ask ${context.industry || 'their'} customers)
8. Post your first Google Business update
9. Respond to reviews (template for positive and negative)

Make every step specific to their business type and location. Don't be generic.`;
}

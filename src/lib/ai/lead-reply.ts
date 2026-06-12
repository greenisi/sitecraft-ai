// Drafts a personalized reply to an incoming lead on behalf of the business
// owner. The draft is embedded in the owner's alert email with a one-click
// "send" link — the owner stays in control, the AI does the writing.

import { getAnthropicClient, withRetry } from './client';

// Drafting is short-form copywriting — Haiku is fast and cheap enough to run
// on every single lead without gating.
const DRAFT_MODEL = 'claude-haiku-4-5-20251001';

export interface LeadReplyContext {
  businessName: string;
  industry?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: Record<string, string> | null;
  services?: Array<{ name: string; description?: string | null; price?: number | null }>;
  lead: {
    name?: string | null;
    message?: string | null;
    serviceNeeded?: string | null;
    preferredDate?: string | null;
    formType: string;
  };
}

export async function draftLeadReply(ctx: LeadReplyContext): Promise<string | null> {
  try {
    const client = getAnthropicClient();

    const serviceList = (ctx.services || [])
      .slice(0, 10)
      .map((s) => `- ${s.name}${s.price ? ` ($${s.price})` : ''}${s.description ? `: ${s.description}` : ''}`)
      .join('\n');

    const leadDetails = [
      ctx.lead.name && `Name: ${ctx.lead.name}`,
      ctx.lead.serviceNeeded && `Service requested: ${ctx.lead.serviceNeeded}`,
      ctx.lead.preferredDate && `Preferred date: ${ctx.lead.preferredDate}`,
      ctx.lead.message && `Their message: "${ctx.lead.message}"`,
      `Form type: ${ctx.lead.formType}`,
    ].filter(Boolean).join('\n');

    const response = await withRetry(() =>
      client.messages.create({
        model: DRAFT_MODEL,
        max_tokens: 400,
        system: [
          `You write replies to customer inquiries on behalf of "${ctx.businessName}"${ctx.industry ? `, a ${ctx.industry} business` : ''}.`,
          'Write like the business owner texting a customer back: warm, brief, concrete. 3-6 sentences.',
          'Address what they actually asked. If they requested a service or date, acknowledge it specifically and propose a clear next step (a call, a quote, confirming the appointment).',
          ctx.phone ? `The business phone is ${ctx.phone} — include it when proposing a call.` : '',
          serviceList ? `Services offered:\n${serviceList}` : '',
          'Never invent prices, availability, or guarantees not listed above. No subject line, no signature block — just the message body. Do not use placeholder brackets.',
        ].filter(Boolean).join('\n\n'),
        messages: [{ role: 'user', content: `A new lead just came in:\n\n${leadDetails}\n\nWrite the reply.` }],
      })
    );

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('')
      .trim();

    return text || null;
  } catch (err) {
    console.error('[Lead Reply] Draft generation failed:', err);
    return null;
  }
}

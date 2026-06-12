// Turns the week's numbers into two or three plain-English sentences for the
// Monday report email. Falls back to a static opener if the model call fails —
// the report always goes out.

import { getAnthropicClient, withRetry } from './client';

const NARRATIVE_MODEL = 'claude-haiku-4-5-20251001';

export interface WeeklyTotals {
  leads: number;
  bookings: number;
  orders: number;
  revenue: number;
}

export interface WeeklyProjectStats {
  name: string;
  leads: number;
  bookings: number;
  bookingsConfirmed: number;
  orders: number;
  revenue: number;
  topPages: Array<[string, number]>;
}

export async function writeWeeklyNarrative(p: {
  totals: WeeklyTotals;
  projects: WeeklyProjectStats[];
}): Promise<string> {
  const fallback =
    p.totals.leads + p.totals.bookings + p.totals.orders > 0
      ? `Your website was busy this week: ${summarize(p.totals)}.`
      : 'A quiet week — your website stayed on duty around the clock, ready for the next visitor.';

  try {
    const client = getAnthropicClient();
    const response = await withRetry(() =>
      client.messages.create({
        model: NARRATIVE_MODEL,
        max_tokens: 200,
        system: [
          'You write the opening lines of a weekly performance email sent to a small-business owner about their website.',
          'Tone: their website is an employee reporting in. Confident, warm, concrete, zero fluff. 2-3 sentences max.',
          'Lead with the most impressive number. If everything is zero, be encouraging without being fake — one sentence about being ready for next week.',
          'Never invent numbers. No greetings, no sign-off, no markdown — just the sentences.',
        ].join('\n'),
        messages: [{
          role: 'user',
          content: `This week's stats:\nTotals: ${JSON.stringify(p.totals)}\nPer site: ${JSON.stringify(
            p.projects.map((x) => ({ name: x.name, leads: x.leads, bookings: x.bookings, confirmed: x.bookingsConfirmed, orders: x.orders, revenue: x.revenue }))
          )}`,
        }],
      })
    );
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('')
      .trim();
    return text || fallback;
  } catch (err) {
    console.error('[Weekly Report] Narrative generation failed:', err);
    return fallback;
  }
}

function summarize(t: WeeklyTotals): string {
  const parts: string[] = [];
  if (t.leads) parts.push(`${t.leads} lead${t.leads === 1 ? '' : 's'}`);
  if (t.bookings) parts.push(`${t.bookings} booking${t.bookings === 1 ? '' : 's'}`);
  if (t.orders) parts.push(`${t.orders} order${t.orders === 1 ? '' : 's'}${t.revenue ? ` ($${t.revenue.toFixed(2)})` : ''}`);
  return parts.join(', ');
}

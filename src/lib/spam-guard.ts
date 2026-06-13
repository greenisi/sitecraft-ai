// Protection for the public form/booking endpoints. These are open CORS
// endpoints where every submission triggers an AI call and up to three
// emails — an unprotected bot loop burns money and sender reputation.
//
// Three layers:
//  1. Honeypot — FormAutoWire injects a hidden `website_url` field; humans
//     never see it, bots fill it. Caught submissions return success (don't
//     tip off the bot) but nothing is stored or sent.
//  2. Per-IP rate limit — max 5 submissions per hour per project from one IP.
//  3. Per-project daily cap — past 150/day the submission is still STORED
//     (a real lead must never be dropped) but AI drafting and emails are
//     skipped; the cron sweep's pending notification still reaches the owner.

import type { SupabaseClient } from '@supabase/supabase-js';

const PER_IP_HOURLY_LIMIT = 5;
const PER_PROJECT_DAILY_CAP = 150;

const HONEYPOT_FIELDS = ['website_url', '_gotcha', 'honeypot'];

export function isHoneypotTripped(body: Record<string, unknown>): boolean {
  return HONEYPOT_FIELDS.some((f) => typeof body[f] === 'string' && (body[f] as string).trim() !== '');
}

export interface SpamCheckResult {
  /** false → reject the request outright (429) */
  allowed: boolean;
  /** true → store the submission but skip AI + inline emails */
  degraded: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkSubmissionRate(
  supabase: SupabaseClient<any>,
  table: 'form_submissions' | 'bookings',
  projectId: string,
  ip: string
): Promise<SpamCheckResult> {
  const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 86400 * 1000).toISOString();

  try {
    const [ipCount, projectCount] = await Promise.all([
      ip && ip !== 'unknown'
        ? supabase
            .from(table)
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('ip_address', ip)
            .gte('created_at', hourAgo)
        : Promise.resolve({ count: 0 }),
      supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .gte('created_at', dayAgo),
    ]);

    if ((ipCount.count ?? 0) >= PER_IP_HOURLY_LIMIT) {
      return { allowed: false, degraded: false };
    }
    return { allowed: true, degraded: (projectCount.count ?? 0) >= PER_PROJECT_DAILY_CAP };
  } catch (err) {
    // Never let the guard break a legitimate submission.
    console.error('[Spam Guard] Rate check failed, allowing:', err);
    return { allowed: true, degraded: false };
  }
}

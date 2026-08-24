import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';
import { getRenewalPrice, renewDomain } from '@/lib/domains/namecom-renew';

/**
 * Daily renewal cron. Wired in vercel.json:
 *   { "crons": [{ "path": "/api/cron/renew-domains", "schedule": "0 7 * * *" }] }
 *
 * Strategy:
 *   - Find purchased domains with auto_renew=true expiring within 30 days
 *     where renewal_attempt_count < 5
 *   - For each: quote live renewal price → off-session charge user's saved card
 *     → renew at Name.com → update expires_at
 *   - On failure: bump attempt count + log; retry tomorrow up to 5 attempts
 *
 * Auth: requires Bearer ${CRON_SECRET} header, or Vercel's built-in cron auth.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sb = createAdminClient();
  const cutoff = new Date(Date.now() + 30 * 86400 * 1000).toISOString();

  const { data: rows } = await sb
    .from('domains')
    .select('*')
    .eq('domain_type', 'purchased')
    .eq('auto_renew', true)
    .neq('status', 'expired')
    .lt('expires_at', cutoff)
    .lt('renewal_attempt_count', 5);

  const results: Array<{ domain: string; ok: boolean; reason?: string; renewedUntil?: string }> = [];

  for (const row of rows ?? []) {
    try {
      // profiles has no email column, and this never used one anyway. Asking
      // for it made the whole select error, so `profile` came back null and
      // every renewal failed as no_stripe_customer_on_file -- burning an
      // attempt each night until the domain passed the attempt cap and
      // stopped being picked up at all.
      const { data: profile, error: profileError } = await sb
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', row.user_id)
        .single();
      if (profileError) {
        throw new Error(`profile_lookup_failed: ${profileError.message}`);
      }
      if (!profile?.stripe_customer_id) {
        throw new Error('no_stripe_customer_on_file');
      }

      // Live renewal price from Name.com — different from registration price.
      const renewalUsd = await getRenewalPrice(row.domain);
      const renewalCents = Math.round(renewalUsd * 100);

      const stripe = getStripe();
      const intent = await stripe.paymentIntents.create({
        amount: renewalCents,
        currency: 'usd',
        customer: profile.stripe_customer_id,
        off_session: true,
        confirm: true,
        description: `Domain renewal: ${row.domain}`,
        metadata: {
          kind: 'domain_renewal',
          domain: row.domain,
          domain_id: row.id,
        },
      });

      const renewed = await renewDomain(row.domain, renewalUsd);

      await sb
        .from('domains')
        .update({
          expires_at: new Date(renewed.domain.expireDate).toISOString(),
          renewal_charged_at: new Date().toISOString(),
          renewal_attempt_count: 0,
          renewal_last_error: null,
          stripe_payment_intent_id: intent.id,
        })
        .eq('id', row.id);

      results.push({ domain: row.domain, ok: true, renewedUntil: renewed.domain.expireDate });
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'unknown';
      await sb
        .from('domains')
        .update({
          renewal_attempt_count: (row.renewal_attempt_count ?? 0) + 1,
          renewal_last_error: reason.slice(0, 480),
        })
        .eq('id', row.id);
      results.push({ domain: row.domain, ok: false, reason });
    }
  }

  return NextResponse.json({ checked: rows?.length ?? 0, results });
}

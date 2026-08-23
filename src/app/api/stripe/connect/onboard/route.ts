import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import {
  classifyStripeConnectError,
  getAppOrigin,
} from '@/lib/billing/stripe-connect-errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

async function getAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

async function getOrCreateConnectAccount(
  supabase: SupabaseClient,
  user: User,
) {
  const stripe = getStripe();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw new Error('Unable to load the account profile');
  }

  const existingAccountId = profile?.stripe_connect_account_id;
  if (existingAccountId) {
    try {
      // Account Links only work for accounts controlled by this platform.
      // Preflight the saved ID so stale references get a recoverable path.
      await stripe.accounts.retrieve(existingAccountId);
      return existingAccountId;
    } catch (error) {
      const classified = classifyStripeConnectError(error);
      if (classified.code !== 'connect_account_unavailable') {
        throw error;
      }
      // Do not clear or deauthorize the previous account. A replacement is
      // persisted only after Stripe successfully creates it below.
    }
  }

  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      user_id: user.id,
      scope: 'user_default',
    },
  });

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      stripe_connect_account_id: account.id,
      stripe_connect_charges_enabled: false,
      stripe_connect_onboarding_complete: false,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Stripe Connect profile update failed:', updateError);
    throw new Error('Unable to save the Stripe connection');
  }

  return account.id;
}

async function createOnboardingLink(accountId: string) {
  const origin = getAppOrigin();
  return getStripe().accountLinks.create({
    account: accountId,
    // Stripe Account Links are single-use. Returning to this GET handler
    // creates a fresh link instead of leaving the user at a dead end.
    refresh_url: `${origin}/api/stripe/connect/onboard`,
    return_url: `${origin}/settings?stripe=success`,
    type: 'account_onboarding',
  });
}

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in again to connect Stripe.', code: 'unauthorized' },
        { status: 401 },
      );
    }

    const accountId = await getOrCreateConnectAccount(supabase, user);
    const accountLink = await createOnboardingLink(accountId);

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect onboard error:', error);
    const classified = classifyStripeConnectError(error);
    return NextResponse.json(
      { error: classified.message, code: classified.code },
      { status: classified.status },
    );
  }
}

/**
 * Stripe sends expired or already-used Account Links here. Generate a fresh
 * single-use link and immediately resume hosted onboarding.
 */
export async function GET() {
  const origin = getAppOrigin();

  try {
    const supabase = await createRouteHandlerClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.redirect(`${origin}/login?redirect=/settings`);
    }

    const accountId = await getOrCreateConnectAccount(supabase, user);
    const accountLink = await createOnboardingLink(accountId);
    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error('Stripe Connect refresh error:', error);
    const classified = classifyStripeConnectError(error);
    const returnUrl = new URL('/settings', origin);
    returnUrl.searchParams.set('stripe', 'error');
    returnUrl.searchParams.set('reason', classified.code);
    return NextResponse.redirect(returnUrl);
  }
}

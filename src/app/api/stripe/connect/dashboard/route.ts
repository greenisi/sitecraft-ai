import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import {
  classifyStripeConnectError,
  getAppOrigin,
} from '@/lib/billing/stripe-connect-errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Express Dashboard links are short-lived and must be created server-side.
 * Keeping this behind the authenticated session avoids exposing a reusable
 * account URL or relying on an invalid dashboard path.
 */
export async function GET() {
  const origin = getAppOrigin();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login?redirect=/settings`);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_connect_account_id) {
      return NextResponse.redirect(`${origin}/settings?stripe=not_connected`);
    }

    const loginLink = await getStripe().accounts.createLoginLink(
      profile.stripe_connect_account_id,
    );
    return NextResponse.redirect(loginLink.url);
  } catch (error) {
    console.error('Stripe Express dashboard link error:', error);
    const classified = classifyStripeConnectError(error);
    const returnUrl = new URL('/settings', origin);
    returnUrl.searchParams.set('stripe', 'error');
    returnUrl.searchParams.set('reason', classified.code);
    return NextResponse.redirect(returnUrl);
  }
}

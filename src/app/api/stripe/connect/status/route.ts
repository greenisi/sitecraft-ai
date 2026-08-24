import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { classifyStripeConnectError } from '@/lib/billing/stripe-connect-errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!user) {
      console.error('No user found in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_connect_charges_enabled')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Stripe Connect profile lookup failed:', profileError);
      return NextResponse.json(
        { error: 'Failed to load Stripe connection status', code: 'profile_unavailable' },
        { status: 500 },
      );
    }

    if (!profile?.stripe_connect_account_id) {
      return NextResponse.json({
        configured: true,
        connected: false,
        accountId: null,
        chargesEnabled: false,
        onboardingComplete: false,
      });
    }

    // Check live status from Stripe
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);

    const chargesEnabled = account.charges_enabled || false;
    const detailsSubmitted = account.details_submitted || false;

    // Update DB if status changed
    if (
      chargesEnabled !== profile.stripe_connect_charges_enabled ||
      detailsSubmitted !== profile.stripe_connect_onboarding_complete
    ) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          stripe_connect_charges_enabled: chargesEnabled,
          stripe_connect_onboarding_complete: detailsSubmitted,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Stripe Connect status sync failed:', updateError);
      }
    }

    return NextResponse.json({
      configured: true,
      connected: true,
      accountId: profile.stripe_connect_account_id,
      chargesEnabled,
      onboardingComplete: detailsSubmitted,
      dashboardUrl: account.charges_enabled
        ? '/api/stripe/connect/dashboard'
        : null,
    });
  } catch (error) {
    console.error('Stripe Connect status error:', error);
    const classified = classifyStripeConnectError(error);
    return NextResponse.json(
      {
        configured: classified.code !== 'connect_not_configured',
        connected: false,
        accountId: null,
        chargesEnabled: false,
        onboardingComplete: false,
        dashboardUrl: null,
        error: classified.message,
        code: classified.code,
      },
      { status: classified.status },
    );
  }
}

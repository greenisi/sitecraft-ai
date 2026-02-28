import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_connect_charges_enabled')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_connect_account_id) {
      return NextResponse.json({
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
      await supabase
        .from('profiles')
        .update({
          stripe_connect_charges_enabled: chargesEnabled,
          stripe_connect_onboarding_complete: detailsSubmitted,
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      connected: true,
      accountId: profile.stripe_connect_account_id,
      chargesEnabled,
      onboardingComplete: detailsSubmitted,
      dashboardUrl: account.charges_enabled
        ? 'https://dashboard.stripe.com/' + profile.stripe_connect_account_id
        : null,
    });
  } catch (error) {
    console.error('Stripe Connect status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe Connect status' },
      { status: 500 }
    );
  }
}

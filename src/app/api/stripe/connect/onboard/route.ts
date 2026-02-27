import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripe = getStripe();

    // Check if user already has a connected account
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single();

    let accountId = profile?.stripe_connect_account_id;

    if (!accountId) {
      // Create a new Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          user_id: user.id,
        },
      });
      accountId = account.id;

      // Save the account ID
      await supabase
        .from('profiles')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', user.id);
    }

    // Create an account onboarding link
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: origin + '/settings?stripe=refresh',
      return_url: origin + '/settings?stripe=success',
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect onboard error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect onboarding link' },
      { status: 500 }
    );
  }
}

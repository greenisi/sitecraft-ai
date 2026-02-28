import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Supabase auth error:', authError.message);
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message }, 
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('No user found in session - cookies may not be properly set');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' }, 
        { status: 401 }
      );
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

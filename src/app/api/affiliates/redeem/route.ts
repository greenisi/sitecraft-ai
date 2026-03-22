import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get affiliate record
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, free_months_earned, free_months_used')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'No active affiliate account found' }, { status: 404 });
    }

    const freeMonthsAvailable = (affiliate.free_months_earned || 0) - (affiliate.free_months_used || 0);
    if (freeMonthsAvailable <= 0) {
      return NextResponse.json({ error: 'No free months available to redeem' }, { status: 400 });
    }

    // Get user's subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found. You need an active subscription to redeem a free month.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create a 100% off coupon for one billing cycle
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'once',
      name: 'Affiliate Free Month Reward',
      metadata: {
        source: 'affiliate_reward',
        user_id: user.id,
        affiliate_id: affiliate.id,
      },
    });

    // Apply the coupon to the subscription
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      discounts: [{ coupon: coupon.id }],
    });

    // Increment free_months_used
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({ free_months_used: (affiliate.free_months_used || 0) + 1 })
      .eq('id', affiliate.id);

    if (updateError) {
      console.error('Failed to update free_months_used:', updateError);
      return NextResponse.json({ error: 'Failed to record redemption' }, { status: 500 });
    }

    // Mark the oldest unrewarded converted referral as rewarded
    const { data: referral } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'converted')
      .is('rewarded_at', null)
      .order('converted_at', { ascending: true })
      .limit(1)
      .single();

    if (referral) {
      await supabase
        .from('referrals')
        .update({ status: 'rewarded', rewarded_at: new Date().toISOString() })
        .eq('id', referral.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Affiliate redeem error:', error);
    const message = error instanceof Error ? error.message : 'Failed to redeem free month';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

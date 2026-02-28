import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Check if a Stripe session has already been processed
 * Returns true if already processed, false otherwise
 */
async function isSessionProcessed(sessionId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('processed_stripe_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[VerifySession] Error checking processed session:', error);
  }

  return !!data;
}

/**
 * Mark a Stripe session as processed to prevent double fulfillment
 */
async function markSessionProcessed(
  sessionId: string,
  userId: string,
  priceType: string | null,
  mode: string,
  creditsAdded: number
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('processed_stripe_sessions')
    .insert({
      session_id: sessionId,
      user_id: userId,
      price_type: priceType,
      mode: mode,
      credits_added: creditsAdded,
      processed_by: 'verify-session',
    });

  if (error) {
    // If unique constraint violation, session was already processed
    if (error.code === '23505') {
      console.log('[VerifySession] Session already processed (concurrent request):', sessionId);
      return false;
    }
    console.error('[VerifySession] Error marking session as processed:', error);
    return false;
  }

  return true;
}

/**
 * Track referral conversion using affiliates table
 * referred_by stores the affiliate table ID (not user_id)
 */
async function trackReferralConversion(userId: string, amountInCents: number) {
  try {
    // Check if this user was referred
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .single();

    if (!profile?.referred_by) {
      return; // User was not referred
    }

    const affiliateId = profile.referred_by; // This is the affiliate table ID
    const amountInDollars = amountInCents / 100;

    // Find the affiliate record by ID
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id, user_id, total_conversions, total_earnings, free_months_earned')
      .eq('id', affiliateId)
      .single();

    if (!affiliate) {
      console.log('[VerifySession] No affiliate record found for ID:', affiliateId);
      return;
    }

    // Update the referral entry to 'converted'
    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('referred_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (referral) {
      await supabaseAdmin
        .from('referrals')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          plan_purchased: 'credits',
        })
        .eq('id', referral.id);
    }

    // Update affiliate conversion count and earnings
    await supabaseAdmin
      .from('affiliates')
      .update({
        total_conversions: (affiliate.total_conversions || 0) + 1,
        total_earnings: (parseFloat(String(affiliate.total_earnings)) || 0) + amountInDollars,
        free_months_earned: (affiliate.free_months_earned || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliate.id);

    console.log('[VerifySession] Tracked referral conversion', {
      affiliateId: affiliate.id,
      referrerId: affiliate.user_id,
      referredUserId: userId,
      amount: amountInDollars,
    });
  } catch (err) {
    console.error('[VerifySession] Error tracking referral conversion:', err);
  }
}

/**
 * POST /api/stripe/verify-session
 * Called by the pricing page when a user returns from Stripe checkout.
 * Verifies the session is paid and fulfills the order if the webhook hasn't already.
 * 
 * FIX 1: Now checks processed_stripe_sessions table to prevent double fulfillment
 * FIX 4: Now adds credits instead of overwriting for Pro subscriptions
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { sessionId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { sessionId } = body;
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  try {
    // FIX 1: Check if this session has already been processed
    const alreadyProcessed = await isSessionProcessed(sessionId);
    if (alreadyProcessed) {
      console.log('[VerifySession] Session already processed, returning success:', sessionId);
      
      // Fetch current profile state to return
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();
      
      return NextResponse.json({ 
        status: 'already_fulfilled', 
        plan: profile?.plan || 'free',
        message: 'This payment was already processed'
      });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify this session belongs to the requesting user
    if (session.metadata?.supabase_user_id !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 });
    }

    // Verify payment is complete
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed', status: session.payment_status }, { status: 400 });
    }

    const priceType = session.metadata?.price_type;

    // Check current profile state
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('plan, generation_credits, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let fulfilled = false;

    if (session.mode === 'subscription') {
      // Check if already fulfilled by checking subscription ID
      if (profile.plan === 'pro' && profile.stripe_subscription_id === session.subscription) {
        return NextResponse.json({ status: 'already_fulfilled', plan: 'pro' });
      }

      // FIX 4: Calculate new credits (add 100 instead of setting to 100)
      const currentCredits = profile.generation_credits || 0;
      const newCredits = currentCredits + 100;

      // FIX 1: Mark session as processed BEFORE updating
      const marked = await markSessionProcessed(sessionId, user.id, priceType || null, 'subscription', 100);
      if (!marked) {
        // Session was processed by another request (webhook), return success
        return NextResponse.json({ 
          status: 'already_fulfilled', 
          plan: 'pro',
          message: 'Payment processed by webhook'
        });
      }

      // Fulfill the subscription
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          plan: 'pro',
          stripe_subscription_id: session.subscription as string,
          generation_credits: newCredits,
        })
        .eq('id', user.id);

      if (error) {
        console.error('[VerifySession] Failed to update profile', { userId: user.id, error });
        return NextResponse.json({ error: 'Failed to activate plan' }, { status: 500 });
      }

      fulfilled = true;
      console.log('[VerifySession] Fulfilled subscription for user', {
        userId: user.id,
        previousCredits: currentCredits,
        newCredits,
      });

      // Track referral conversion
      await trackReferralConversion(user.id, session.amount_total || 0);
    } else if (session.mode === 'payment') {
      const creditAmounts: Record<string, number> = {
        credits_10: 10,
        credits_50: 50,
      };
      const creditsToAdd = creditAmounts[priceType || ''] || 0;

      if (creditsToAdd > 0) {
        const currentCredits = profile.generation_credits || 0;

        // FIX 1: Mark session as processed BEFORE updating
        const marked = await markSessionProcessed(sessionId, user.id, priceType || null, 'payment', creditsToAdd);
        if (!marked) {
          // Session was processed by another request (webhook), return success
          return NextResponse.json({ 
            status: 'already_fulfilled', 
            plan: profile.plan,
            message: 'Payment processed by webhook'
          });
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ generation_credits: currentCredits + creditsToAdd })
          .eq('id', user.id);

        if (error) {
          console.error('[VerifySession] Failed to add credits', { userId: user.id, error });
          return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
        }

        fulfilled = true;
        console.log('[VerifySession] Added credits for user', {
          userId: user.id,
          added: creditsToAdd,
          newTotal: currentCredits + creditsToAdd,
        });

        // Track referral conversion
        await trackReferralConversion(user.id, session.amount_total || 0);
      }
    }

    return NextResponse.json({
      status: fulfilled ? 'fulfilled' : 'no_action',
      plan: session.mode === 'subscription' ? 'pro' : profile.plan,
    });
  } catch (err) {
    console.error('[VerifySession] Error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

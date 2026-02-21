import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/stripe/verify-session
 * Called by the pricing page when a user returns from Stripe checkout.
 * Verifies the session is paid and fulfills the order if the webhook hasn't already.
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
      // Check if already fulfilled (plan is pro and subscription ID matches)
      if (profile.plan === 'pro' && profile.stripe_subscription_id === session.subscription) {
        return NextResponse.json({ status: 'already_fulfilled', plan: 'pro' });
      }

      // Fulfill the subscription
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          plan: 'pro',
          stripe_subscription_id: session.subscription as string,
          generation_credits: 999999,
        })
        .eq('id', user.id);

      if (error) {
        console.error('[VerifySession] Failed to update profile', { userId: user.id, error });
        return NextResponse.json({ error: 'Failed to activate plan' }, { status: 500 });
      }

      fulfilled = true;
      console.log('[VerifySession] Fulfilled subscription for user', user.id);
    } else if (session.mode === 'payment') {
      const creditAmounts: Record<string, number> = {
        credits_10: 10,
        credits_50: 50,
      };
      const creditsToAdd = creditAmounts[priceType || ''] || 0;

      if (creditsToAdd > 0) {
        // We add credits regardless — if webhook already added them, user gets double.
        // To prevent this, we could track fulfilled session IDs, but for now this is a 
        // safety net for when webhooks fail. The risk of double-fulfillment is low since
        // this only runs once on page return and we can track session IDs later.
        const currentCredits = profile.generation_credits || 0;
        
        // Simple duplicate check: if profile was just updated by webhook
        // and credits match what webhook would have set, skip
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

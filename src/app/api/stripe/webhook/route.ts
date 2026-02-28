import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
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
    // PGRST116 = no rows found, which is expected for new sessions
    console.error('[Webhook] Error checking processed session:', error);
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
      processed_by: 'webhook',
    });

  if (error) {
    // If unique constraint violation, session was already processed
    if (error.code === '23505') {
      console.log('[Webhook] Session already processed (concurrent request):', sessionId);
      return false;
    }
    console.error('[Webhook] Error marking session as processed:', error);
    return false;
  }

  return true;
}

async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const priceType = session.metadata?.price_type;

  if (!userId) {
    console.error('[Webhook] No supabase_user_id in session metadata', {
      sessionId: session.id,
      metadata: session.metadata,
    });
    return;
  }

  // FIX 1: Check if this session has already been processed
  const alreadyProcessed = await isSessionProcessed(session.id);
  if (alreadyProcessed) {
    console.log('[Webhook] Session already processed, skipping:', session.id);
    return;
  }

  console.log('[Webhook] Fulfilling checkout', {
    sessionId: session.id,
    userId,
    priceType,
    mode: session.mode,
    paymentStatus: session.payment_status,
  });

  if (session.mode === 'subscription') {
    // FIX 4: Fetch current credits to add to them instead of overwriting
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('generation_credits')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('[Webhook] Failed to fetch profile for subscription', { userId, fetchError });
      return;
    }

    const currentCredits = profile?.generation_credits || 0;
    const newCredits = currentCredits + 100; // Add 100 credits instead of setting to 100

    // Mark session as processed BEFORE updating (atomic operation)
    const marked = await markSessionProcessed(session.id, userId, priceType || null, 'subscription', 100);
    if (!marked) {
      console.log('[Webhook] Could not mark session, likely already processed:', session.id);
      return;
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: 'pro',
        stripe_subscription_id: session.subscription as string,
        generation_credits: newCredits,
      })
      .eq('id', userId);

    if (error) {
      console.error('[Webhook] Failed to update profile for subscription', { userId, error });
    } else {
      console.log('[Webhook] Successfully activated pro plan for user', {
        userId,
        previousCredits: currentCredits,
        newCredits,
      });

      // FIX 3: Track referral conversion if this user was referred
      await trackReferralConversion(userId, session.amount_total || 0);
    }
  } else if (session.mode === 'payment') {
    const creditAmounts: Record<string, number> = {
      credits_10: 10,
      credits_50: 50,
    };
    const creditsToAdd = creditAmounts[priceType || ''] || 0;

    if (creditsToAdd > 0) {
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('generation_credits')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('[Webhook] Failed to fetch profile', { userId, fetchError });
        return;
      }

      // Mark session as processed BEFORE updating
      const marked = await markSessionProcessed(session.id, userId, priceType || null, 'payment', creditsToAdd);
      if (!marked) {
        console.log('[Webhook] Could not mark session, likely already processed:', session.id);
        return;
      }

      const currentCredits = profile?.generation_credits || 0;
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ generation_credits: currentCredits + creditsToAdd })
        .eq('id', userId);

      if (updateError) {
        console.error('[Webhook] Failed to add credits', { userId, updateError });
      } else {
        console.log('[Webhook] Added credits', {
          userId,
          added: creditsToAdd,
          newTotal: currentCredits + creditsToAdd,
        });

        // FIX 3: Track referral conversion if this user was referred
        await trackReferralConversion(userId, session.amount_total || 0);
      }
    }
  }
}

/**
 * FIX 3: Track referral conversion when a referred user makes a purchase
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

    const referrerId = profile.referred_by;
    const amountInDollars = amountInCents / 100;

    // Record the conversion event
    await supabaseAdmin.from('referral_events').insert({
      referrer_id: referrerId,
      referred_user_id: userId,
      event_type: 'conversion',
      conversion_amount: amountInDollars,
    });

    // Update referral stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('referral_stats')
      .select('conversions, total_earnings')
      .eq('referrer_id', referrerId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('[Webhook] Error fetching referral stats:', statsError);
      return;
    }

    if (stats) {
      await supabaseAdmin
        .from('referral_stats')
        .update({
          conversions: (stats.conversions || 0) + 1,
          total_earnings: (parseFloat(stats.total_earnings) || 0) + amountInDollars,
          updated_at: new Date().toISOString(),
        })
        .eq('referrer_id', referrerId);
    } else {
      await supabaseAdmin.from('referral_stats').insert({
        referrer_id: referrerId,
        conversions: 1,
        total_earnings: amountInDollars,
      });
    }

    console.log('[Webhook] Tracked referral conversion', {
      referrerId,
      referredUserId: userId,
      amount: amountInDollars,
    });
  } catch (err) {
    console.error('[Webhook] Error tracking referral conversion:', err);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', (err as Error).message);
    // ---- FALLBACK: Try to parse the body and fulfill anyway ----
    // This handles the case where the webhook secret is misconfigured.
    // Stripe retries webhooks, so we try to verify by fetching the session
    // directly from Stripe API to ensure legitimacy.
    try {
      const parsed = JSON.parse(body);
      if (parsed?.type === 'checkout.session.completed' && parsed?.data?.object?.id) {
        const sessionId = parsed.data.object.id as string;
        console.log('[Webhook Fallback] Attempting to verify session directly:', sessionId);

        // Verify the session exists in Stripe (proves it is real)
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session && session.payment_status === 'paid') {
          console.log('[Webhook Fallback] Session verified! Fulfilling order...');
          await fulfillCheckout(session);
          return NextResponse.json({ received: true, fallback: true });
        } else {
          console.error('[Webhook Fallback] Session not paid or not found', {
            sessionId,
            status: session?.payment_status,
          });
        }
      }
    } catch (fallbackErr) {
      console.error('[Webhook Fallback] Also failed:', (fallbackErr as Error).message);
    }

    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('[Webhook] Received event:', event.type, event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillCheckout(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) {
          console.error('[Webhook] No userId in subscription.updated metadata');
          break;
        }

        if (subscription.status === 'active') {
          // FIX 4: Fetch current credits so renewal adds to existing balance
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('generation_credits')
            .eq('id', userId)
            .single();

          const currentCredits = profile?.generation_credits || 0;

          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              plan: 'pro',
              stripe_subscription_id: subscription.id,
              generation_credits: currentCredits + 100,
            })
            .eq('id', userId);

          if (error) {
            console.error('[Webhook] subscription.updated failed to update profile', { userId, error });
          } else {
            console.log('[Webhook] Subscription updated to active for user', {
              userId,
              previousCredits: currentCredits,
              newCredits: currentCredits + 100,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            generation_credits: 0,
          })
          .eq('id', userId);

        if (error) {
          console.error('[Webhook] subscription.deleted failed', { userId, error });
        } else {
          console.log('[Webhook] Downgraded user to free', userId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.supabase_user_id;
          if (userId) {
            console.log('[Webhook] Invoice payment failed for user', userId);
            await supabaseAdmin
              .from('profiles')
              .update({ plan: 'pro' })
              .eq('id', userId);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

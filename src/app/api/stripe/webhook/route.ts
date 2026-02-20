import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const runtime = 'nodejs';

// Use service role key for webhook (no user session available)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
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
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const priceType = session.metadata?.price_type;

        if (!userId) break;

        if (session.mode === 'subscription') {
          // Pro plan subscription activated
          await supabaseAdmin
            .from('profiles')
            .update({
              plan: 'pro',
              stripe_subscription_id: session.subscription as string,
              generation_credits: 999999, // effectively unlimited
            })
            .eq('id', userId);
        } else if (session.mode === 'payment') {
          // Credit pack purchase
          const creditAmounts: Record<string, number> = {
            credits_10: 10,
            credits_50: 50,
          };
          const creditsToAdd = creditAmounts[priceType || ''] || 0;

          if (creditsToAdd > 0) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('generation_credits')
              .eq('id', userId)
              .single();

            const currentCredits = profile?.generation_credits || 0;

            await supabaseAdmin
              .from('profiles')
              .update({
                generation_credits: currentCredits + creditsToAdd,
              })
              .eq('id', userId);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) break;

        if (subscription.status === 'active') {
          await supabaseAdmin
            .from('profiles')
            .update({
              plan: 'pro',
              stripe_subscription_id: subscription.id,
              generation_credits: 999999,
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) break;

        // Downgrade to beta (keep some credits as goodwill)
        await supabaseAdmin
          .from('profiles')
          .update({
            plan: 'beta',
            stripe_subscription_id: null,
            generation_credits: 5,
          })
          .eq('id', userId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.supabase_user_id;

          if (userId) {
            // Mark as past due but don't immediately downgrade
            await supabaseAdmin
              .from('profiles')
              .update({ plan: 'pro' }) // Keep pro for grace period
              .eq('id', userId);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

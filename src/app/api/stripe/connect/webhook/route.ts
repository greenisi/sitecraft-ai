import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client for webhook processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stripe Connect webhook events to handle
const relevantEvents = new Set([
  'account.updated',
  'account.application.deauthorized',
  'capability.updated',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  // Get the Connect webhook secret - may be different from main webhook
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe Connect webhook secret not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  if (!sig) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  // Process relevant events
  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'account.updated': {
          const account = event.data.object as Stripe.Account;
          console.log(`Stripe Connect account updated: ${account.id}`);

          // Update the user's profile with the latest account status
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              stripe_connect_charges_enabled: account.charges_enabled || false,
              stripe_connect_onboarding_complete: account.details_submitted || false,
            })
            .eq('stripe_connect_account_id', account.id);

          if (error) {
            console.error('Error updating profile:', error);
          } else {
            console.log(`Updated profile for Connect account ${account.id}: charges_enabled=${account.charges_enabled}, details_submitted=${account.details_submitted}`);
          }
          break;
        }

        case 'account.application.deauthorized': {
          const account = event.data.object as Stripe.Account;
          console.log(`Stripe Connect account deauthorized: ${account.id}`);

          // Clear the Connect account from the user's profile
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              stripe_connect_account_id: null,
              stripe_connect_charges_enabled: false,
              stripe_connect_onboarding_complete: false,
            })
            .eq('stripe_connect_account_id', account.id);

          if (error) {
            console.error('Error clearing Connect account:', error);
          } else {
            console.log(`Cleared Connect account ${account.id} from profile`);
          }
          break;
        }

        case 'capability.updated': {
          // A capability on a connected account was updated
          const capability = event.data.object as Stripe.Capability;
          console.log(`Capability ${capability.id} updated for account ${capability.account}: status=${capability.status}`);
          // The account.updated event will also fire, so we can rely on that for status updates
          break;
        }
      }
    } catch (error) {
      console.error('Error processing Connect webhook event:', error);
      return NextResponse.json(
        { error: 'Error processing webhook' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

// Explicitly handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint only accepts POST requests from Stripe webhooks.' },
    { status: 405 }
  );
}

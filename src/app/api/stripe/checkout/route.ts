import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';

export const runtime = 'nodejs';

interface RequestBody {
  priceType: 'pro_monthly' | 'pro_yearly' | 'credits_10' | 'credits_50';
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { priceType } = body;

  // Map price types to Stripe price IDs
  const priceMap: Record<string, string> = {
    pro_monthly: STRIPE_PRICES.PRO_MONTHLY,
    pro_yearly: STRIPE_PRICES.PRO_YEARLY,
    credits_10: STRIPE_PRICES.CREDITS_10,
    credits_50: STRIPE_PRICES.CREDITS_50,
  };

  const priceId = priceMap[priceType];
  if (!priceId) {
    return NextResponse.json(
      { error: 'Invalid price type or price not configured' },
      { status: 400 }
    );
  }

  // Check if user already has a Stripe customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, plan')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  // Create Stripe customer if not exists
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    customerId = customer.id;

    // Save the customer ID to the profile
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  // Determine if this is a subscription or one-time payment
  const isSubscription = priceType === 'pro_monthly' || priceType === 'pro_yearly';

  const origin = request.headers.get('origin') || 'https://app.innovated.marketing';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/pricing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?payment=cancelled`,
    metadata: {
      supabase_user_id: user.id,
      price_type: priceType,
    },
    ...(isSubscription && {
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    }),
  });

  return NextResponse.json({ url: session.url });
}

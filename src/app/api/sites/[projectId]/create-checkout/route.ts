import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { items, successUrl, cancelUrl } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the project and its owner's Stripe Connect account
    const { data: project } = await supabase
      .from('projects')
      .select('user_id, name, slug')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get the owner's Stripe Connect account
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_charges_enabled')
      .eq('id', project.user_id)
      .single();

    if (!profile?.stripe_connect_account_id || !profile.stripe_connect_charges_enabled) {
      return NextResponse.json(
        { error: 'This store has not set up payments yet' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Build line items for Stripe Checkout
    const lineItems = items.map((item: { name: string; price: number; quantity: number; image?: string }) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          ...(item.image ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity || 1,
    }));

    // Determine URLs
    const origin = successUrl ? new URL(successUrl).origin : request.headers.get('origin') || '';
    const finalSuccessUrl = successUrl || origin + '/checkout/success?session_id={CHECKOUT_SESSION_ID}';
    const finalCancelUrl = cancelUrl || origin + '/';

    // Create Stripe Checkout session on the connected account
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: finalSuccessUrl,
        cancel_url: finalCancelUrl,
        metadata: {
          project_id: projectId,
          project_name: project.name,
        },
      },
      {
        stripeAccount: profile.stripe_connect_account_id,
      }
    );

    // Also save the order to our database
    const orderItems = items.map((item: { name: string; price: number; quantity: number }) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
    }));

    const totalAmount = orderItems.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );

    await supabase.from('orders').insert({
      project_id: projectId,
      items: orderItems,
      total: totalAmount,
      status: 'pending',
      stripe_session_id: session.id,
      customer_email: null,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    console.error('Create checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

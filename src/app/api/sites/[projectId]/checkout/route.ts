import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    // Get project and owner's Stripe account
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', project.user_id)
      .single();

    if (!profile?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Payment not configured. The business owner needs to connect their Stripe account.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { items, customer_email, customer_name } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 });
    }

    if (!customer_email) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    // Get product details
    const productIds = items.map((item: { product_id: string }) => item.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('project_id', projectId)
      .in('id', productIds);

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'Products not found' }, { status: 404 });
    }

    // Calculate totals and build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;
    const orderItems: { product_id: string; name: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) continue;

      const quantity = item.quantity || 1;
      subtotal += product.price * quantity;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: product.name },
          unit_amount: Math.round(product.price * 100),
        },
        quantity,
      });

      orderItems.push({
        product_id: product.id,
        name: product.name,
        quantity,
        price: product.price,
      });
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        project_id: projectId,
        customer_email,
        customer_name: customer_name || null,
        items: orderItems,
        subtotal,
        total: subtotal,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Create Stripe session
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { typescript: true });
    const origin = request.headers.get('origin') || 'https://app.innovated.marketing';

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: lineItems,
        customer_email,
        success_url: `${origin}/api/sites/${projectId}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}?checkout=cancelled`,
        metadata: {
          order_id: order.id,
          project_id: projectId,
        },
      },
      { stripeAccount: profile.stripe_account_id }
    );

    // Update order with stripe session id
    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: session.id })
      .eq('id', order.id);

    // Create notification
    await supabase.from('notifications').insert({
      project_id: projectId,
      type: 'new_order',
      recipient_email: customer_email,
      subject: `New order from ${customer_name || customer_email}`,
      body: `Order ID: ${order.id}\nTotal: $${subtotal.toFixed(2)}\nItems: ${orderItems.map((i) => `${i.name} x${i.quantity}`).join(', ')}`,
      status: 'pending',
    });

    return NextResponse.json({ url: session.url, order_id: order.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

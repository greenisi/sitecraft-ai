import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * SUPERSEDED. Generated storefronts check out through
 * POST /api/storefront/[projectId]/checkout, which is the maintained
 * implementation: it resolves prices from the database, clamps quantities,
 * checks charges_enabled, and reuses Stripe Price objects.
 *
 * This route is kept only because it is a live public endpoint that something
 * older may still call. It is deliberately NOT given CORS headers: bringing a
 * superseded payment path back within reach of every origin is the opposite of
 * what it needs.
 *
 * It previously took `name`, `price` and `quantity` straight from the request
 * body and charged whatever price arrived, so anyone could POST
 * `{"items":[{"name":"Anything","price":0.01,"quantity":1}]}` and create a
 * Stripe session for a cent against the merchant's connected account, then
 * have an order row written with the fabricated total. Prices are now resolved
 * server-side from the products table by id and the client's numbers are
 * ignored entirely.
 */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { items, successUrl, cancelUrl } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 });
    }

    // The client may only say WHICH product and HOW MANY. Never what it costs.
    const productIds: string[] = [];
    for (const item of items) {
      const id = item?.product_id || item?.productId;
      if (typeof id !== 'string' || !id) {
        return NextResponse.json(
          { error: 'Each item must reference a product_id' },
          { status: 400 }
        );
      }
      productIds.push(id);
    }

    const supabase = createAdminClient();

    const { data: project } = await supabase
      .from('projects')
      .select('user_id, name, slug')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_charges_enabled')
      .eq('id', project.user_id)
      .single();

    if (!profile?.stripe_connect_account_id || !profile.stripe_connect_charges_enabled) {
      return NextResponse.json({ error: 'This store has not set up payments yet' }, { status: 400 });
    }

    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, images, is_active')
      .eq('project_id', projectId)
      .in('id', productIds);

    if (!products || products.length !== new Set(productIds).size) {
      return NextResponse.json({ error: 'One or more items are unavailable' }, { status: 400 });
    }
    if (products.some((product) => !product.is_active)) {
      return NextResponse.json({ error: 'One or more items are inactive' }, { status: 400 });
    }

    const lineItems = [];
    const orderItems: Array<{ product_id: string; name: string; price: number; quantity: number }> = [];
    let totalAmount = 0;

    for (const item of items) {
      const id = item.product_id || item.productId;
      const product = products.find((candidate) => candidate.id === id);
      if (!product) {
        return NextResponse.json({ error: 'Item not found' }, { status: 400 });
      }

      const quantity = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      const price = Number(product.price);
      const unitAmount = Math.round(price * 100);
      if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
        return NextResponse.json({ error: `Invalid price for ${product.name}` }, { status: 400 });
      }

      const firstImage = Array.isArray(product.images) && product.images[0]
        ? String(product.images[0])
        : null;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            ...(firstImage ? { images: [firstImage] } : {}),
          },
          unit_amount: unitAmount,
        },
        quantity,
      });

      orderItems.push({ product_id: product.id, name: product.name, price, quantity });
      totalAmount += price * quantity;
    }

    const stripe = getStripe();
    const origin = successUrl ? new URL(successUrl).origin : request.headers.get('origin') || '';
    const finalSuccessUrl = successUrl || origin + '/checkout/success?session_id={CHECKOUT_SESSION_ID}';
    const finalCancelUrl = cancelUrl || origin + '/';

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
      { stripeAccount: profile.stripe_connect_account_id }
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

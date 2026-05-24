import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';
import { getProjectStripeAccount } from '@/lib/billing/stripe-connect';
import { corsPreflight, withCors } from '@/lib/utils/cors';

export async function OPTIONS() { return corsPreflight(); }

/**
 * POST /api/projects/[projectId]/checkout
 *   body: { items: [{ productId, qty }], successUrl?, cancelUrl? }
 *
 * Called by the GENERATED site's checkout button. Public — no auth, because
 * the merchant's customers don't have SiteCraft accounts. We trust projectId
 * as a partial secret (UUID v4, not enumerable) and look up everything else
 * server-side:
 *   1. Resolve the merchant's connected Stripe account
 *   2. Pull product rows from DB (server-side prices — never trust client cart)
 *   3. Lazily create Stripe Product + Price on the connected account
 *   4. Create a Checkout Session on the connected account
 *   5. Return the session URL — order row gets created in the webhook, NOT here
 *      (so abandoned carts don't pollute the orders table)
 */

type IncomingItem = { productId: string; qty: number };

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  let body: { items: IncomingItem[]; successUrl?: string; cancelUrl?: string };
  try { body = await req.json(); }
  catch { return withCors({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return withCors({ error: 'items required' }, { status: 400 });
  }
  if (body.items.length > 25) {
    return withCors({ error: 'Too many items' }, { status: 400 });
  }

  const admin = createAdminClient();

  const account = await getProjectStripeAccount(admin, projectId);
  if (!account) {
    return withCors({ error: 'Merchant has not connected Stripe' }, { status: 503 });
  }
  if (!account.chargesEnabled) {
    return withCors({ error: 'Merchant Stripe account is not yet enabled for charges' }, { status: 503 });
  }

  // Fetch the products the client claims to want. Server validates prices.
  const productIds = body.items.map(i => i.productId);
  const { data: products } = await admin
    .from('products')
    .select('id, name, description, price, image_url, images, stripe_product_id, stripe_price_id, is_active')
    .eq('project_id', projectId)
    .in('id', productIds);

  if (!products || products.length !== productIds.length) {
    return withCors({ error: 'One or more items are unavailable' }, { status: 400 });
  }
  if (products.some(p => !p.is_active)) {
    return withCors({ error: 'One or more items are inactive' }, { status: 400 });
  }

  const stripe = getStripe();
  const lineItems: Array<{ price: string; quantity: number }> = [];

  for (const incoming of body.items) {
    const p = products.find(x => x.id === incoming.productId);
    if (!p) return withCors({ error: 'Item not found' }, { status: 400 });
    const qty = Math.max(1, Math.min(99, Math.floor(incoming.qty)));

    // Existing `products.price` is DECIMAL — convert to integer cents for Stripe.
    const priceCents = Math.round(Number(p.price) * 100);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      return withCors({ error: `Invalid price for ${p.name}` }, { status: 400 });
    }

    // Lazily ensure Stripe Product + Price exist on the connected account.
    let stripeProductId = p.stripe_product_id as string | null;
    let stripePriceId = p.stripe_price_id as string | null;

    // image_url is the canonical single image; images is the gallery array.
    const firstImage = p.image_url ||
      (Array.isArray(p.images) && p.images[0] ? String(p.images[0]) : null);

    if (!stripeProductId) {
      const created = await stripe.products.create(
        { name: p.name, description: p.description ?? undefined, images: firstImage ? [firstImage] : undefined },
        { stripeAccount: account.accountId }
      );
      stripeProductId = created.id;
    }
    if (!stripePriceId) {
      const price = await stripe.prices.create(
        { product: stripeProductId, unit_amount: priceCents, currency: 'usd' },
        { stripeAccount: account.accountId }
      );
      stripePriceId = price.id;
      await admin.from('products').update({
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        stripe_synced_at: new Date().toISOString(),
      }).eq('id', p.id);
    }

    lineItems.push({ price: stripePriceId!, quantity: qty });
  }

  const origin = req.headers.get('origin') ?? '';
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: body.successUrl || `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  body.cancelUrl  || `${origin}/cart`,
      metadata: {
        kind: 'storefront_order',
        project_id: projectId,
        item_summary: body.items.map(i => `${i.productId}:${i.qty}`).join(',').slice(0, 480),
      },
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU'] },
    },
    { stripeAccount: account.accountId }
  );

  return withCors({ url: session.url, sessionId: session.id });
}

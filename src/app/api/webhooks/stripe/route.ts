import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { purchaseDomain, setNameservers } from '@/lib/domains/namecom';
import { addDomainToProject } from '@/lib/export/vercel-domains';
import { toNamecomContact, validateWhois } from '@/lib/domains/contact';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // If no webhook secret configured, just acknowledge
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping webhook verification');
    return NextResponse.json({ received: true });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};

    if (metadata.type === 'domain_purchase') {
      const piId = typeof session.payment_intent === 'string' ? session.payment_intent : undefined;
      await fulfillDomainPurchase(metadata, piId);
    } else if (metadata.kind === 'storefront_order') {
      await fulfillStorefrontOrder(session);
    }
  }

  return NextResponse.json({ received: true });
}

async function fulfillDomainPurchase(metadata: Record<string, string>, paymentIntentId?: string) {
  const { domain, projectId, userId } = metadata;
  if (!domain || !projectId || !userId) {
    console.error('Missing domain purchase metadata:', metadata);
    return;
  }

  const admin = createAdminClient();

  // Idempotency — domain is globally unique among active rows (DB enforces).
  const { data: existing } = await admin
    .from('domains')
    .select('id, status')
    .eq('domain', domain)
    .maybeSingle();

  if (existing) {
    console.log('Domain already fulfilled:', domain);
    return;
  }

  const { data: project } = await admin
    .from('projects')
    .select('id, vercel_project_name, published_url')
    .eq('id', projectId)
    .single();

  if (!project) {
    console.error('Project not found for domain fulfillment:', projectId);
    await autoRefund(paymentIntentId, 'project_missing');
    return;
  }

  // ICANN-compliant contact info from the user's profile. Never hardcoded.
  const { data: profile } = await admin
    .from('profiles')
    .select('whois_contact')
    .eq('id', userId)
    .single();
  const v = validateWhois(profile?.whois_contact);
  if (!v.ok) {
    console.error('WHOIS missing/invalid at fulfillment:', v.error);
    await autoRefund(paymentIntentId, `whois_invalid: ${v.error}`);
    return;
  }
  const contacts = toNamecomContact(v.value);

  try {
    // 1. Purchase domain via Name.com
    const purchaseResult = await purchaseDomain(domain, contacts);
    const expiresAt = purchaseResult.domain?.expireDate
      ? new Date(purchaseResult.domain.expireDate).toISOString()
      : null;

    // 2. Add domain to Vercel project
    let vercelProjectName = project.vercel_project_name;
    if (!vercelProjectName && project.published_url) {
      const urlMatch = project.published_url.match(/https?:\/\/([^.]+)\.innovated\.site/);
      if (urlMatch) vercelProjectName = 'sc-' + urlMatch[1];
    }

    if (vercelProjectName) {
      const vercelConfig = {
        token: process.env.VERCEL_PLATFORM_TOKEN!,
        teamId: process.env.VERCEL_TEAM_ID!,
      };
      await addDomainToProject(vercelProjectName, domain, vercelConfig);
    }

    // 3. Set nameservers
    try {
      await setNameservers(domain, ['ns1.vercel-dns.com', 'ns2.vercel-dns.com']);
    } catch (nsErr) {
      console.warn('Nameserver update note:', nsErr);
    }

    // 4. Create domain record
    await admin.from('domains').insert({
      project_id: projectId,
      user_id: userId,
      domain,
      domain_type: 'purchased',
      status: 'pending',
      dns_configured: true,
      namecom_order_id: String(purchaseResult.order?.orderId || ''),
      expires_at: expiresAt,
      auto_renew: true,
      stripe_payment_intent_id: paymentIntentId ?? null,
    });

    // 5. Update project custom_domain
    await admin
      .from('projects')
      .update({ custom_domain: domain })
      .eq('id', projectId);

    console.log('Domain purchase fulfilled:', domain);
  } catch (error) {
    console.error('Domain fulfillment failed:', domain, error);
    // Refund the user — they paid but we couldn't register the domain.
    await autoRefund(paymentIntentId, error instanceof Error ? error.message : 'fulfillment_failed');
  }
}

/**
 * A customer just paid on a generated storefront. Pull session details
 * (including line items, which Stripe doesn't include in the event by default)
 * from the connected account, then upsert an order row.
 *
 * Idempotent: the orders table has a UNIQUE index on stripe_session_id, so a
 * duplicate webhook fire (Stripe retries) is a no-op.
 */
async function fulfillStorefrontOrder(session: Stripe.Checkout.Session) {
  const projectId = session.metadata?.project_id;
  if (!projectId) {
    console.error('storefront_order webhook missing project_id metadata');
    return;
  }

  const admin = createAdminClient();

  // Find which connected account this ran against. Use the helper that
  // resolves project → user → profile.stripe_connect_account_id.
  const { getProjectStripeAccount } = await import('@/lib/billing/stripe-connect');
  const acct = await getProjectStripeAccount(admin, projectId);
  if (!acct) {
    console.error('storefront_order: no connected account for project', projectId);
    return;
  }
  const account = { stripe_account_id: acct.accountId };

  // Fetch line items + shipping from the connected account (not the platform).
  let lineItems: Stripe.LineItem[] = [];
  try {
    const stripe = getStripe();
    const res = await stripe.checkout.sessions.listLineItems(
      session.id,
      { limit: 25, expand: ['data.price.product'] },
      { stripeAccount: account.stripe_account_id }
    );
    lineItems = res.data;
  } catch (e) {
    console.error('Failed to fetch line items for', session.id, e);
  }

  const itemsSnapshot = lineItems.map(li => {
    const product = li.price?.product as Stripe.Product | string | null | undefined;
    return {
      stripe_line_item_id: li.id,
      name: typeof product === 'object' && product ? product.name : li.description,
      quantity: li.quantity ?? 1,
      unit_amount_cents: li.price?.unit_amount ?? 0,
      total_cents: li.amount_total ?? 0,
    };
  });

  const subtotalDollars = (session.amount_subtotal ?? 0) / 100;
  const taxDollars      = (session.total_details?.amount_tax ?? 0) / 100;
  const totalDollars    = (session.amount_total ?? 0) / 100;

  // Customer details
  const customerEmail = session.customer_details?.email ?? session.customer_email ?? null;
  const customerName  = session.customer_details?.name ?? null;
  const shipping      = session.collected_information?.shipping_details ?? session.shipping_details ?? null;

  const { error } = await admin.from('orders').upsert(
    {
      project_id: projectId,
      customer_email: customerEmail,
      customer_name: customerName,
      items: itemsSnapshot,
      subtotal: subtotalDollars,
      tax: taxDollars,
      total: totalDollars,
      status: 'paid',
      shipping_address: shipping,
      stripe_session_id: session.id,
      stripe_account_id: account.stripe_account_id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      fulfilled_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_session_id' }
  );

  if (error) {
    console.error('Failed to persist storefront order:', error);
  } else {
    console.log('Storefront order recorded:', session.id, 'project', projectId);
  }
}

async function autoRefund(paymentIntentId: string | undefined, reason: string) {
  if (!paymentIntentId) return;
  try {
    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: { auto_refund_reason: reason.slice(0, 480) },
    });
    console.log('Auto-refunded payment_intent:', paymentIntentId, 'reason:', reason);
  } catch (e) {
    console.error('Auto-refund failed:', e);
  }
}

import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { purchaseDomain, setNameservers } from '@/lib/domains/namecom';
import { addDomainToProject } from '@/lib/export/vercel-domains';
import type { ContactInfo } from '@/lib/domains/namecom';
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
      await fulfillDomainPurchase(metadata);
    }
  }

  return NextResponse.json({ received: true });
}

async function fulfillDomainPurchase(metadata: Record<string, string>) {
  const { domain, projectId, userId } = metadata;
  if (!domain || !projectId || !userId) {
    console.error('Missing domain purchase metadata:', metadata);
    return;
  }

  const admin = createAdminClient();

  // Check if already fulfilled
  const { data: existing } = await admin
    .from('domains')
    .select('id')
    .eq('domain', domain)
    .eq('user_id', userId)
    .single();

  if (existing) {
    console.log('Domain already fulfilled:', domain);
    return;
  }

  // Get project info for Vercel
  const { data: project } = await admin
    .from('projects')
    .select('id, vercel_project_name, published_url')
    .eq('id', projectId)
    .single();

  if (!project) {
    console.error('Project not found for domain fulfillment:', projectId);
    return;
  }

  try {
    // 1. Purchase domain via Name.com
    const contacts: ContactInfo = {
      firstName: 'Domain',
      lastName: 'Owner',
      email: 'domains@innovatedmarketing.com',
      phone: '+1.5555555555',
      address1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '90210',
      country: 'US',
    };

    const purchaseResult = await purchaseDomain(domain, contacts);

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
    });

    // 5. Update project custom_domain
    await admin
      .from('projects')
      .update({ custom_domain: domain })
      .eq('id', projectId);

    console.log('Domain purchase fulfilled:', domain);
  } catch (error) {
    console.error('Domain fulfillment failed:', domain, error);
  }
}

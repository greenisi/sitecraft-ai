import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';
import { purchaseDomain, setNameservers } from '@/lib/domains/namecom';
import { addDomainToProject } from '@/lib/export/vercel-domains';
import type { ContactInfo } from '@/lib/domains/namecom';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'AUTH_ERROR' } },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: { message: 'Session ID is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Retrieve the Stripe checkout session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: { message: 'Payment not completed', code: 'PAYMENT_INCOMPLETE' } },
        { status: 400 }
      );
    }

    // Verify the session belongs to this user
    const metadata = session.metadata || {};
    if (metadata.userId !== user.id) {
      return NextResponse.json(
        { error: { message: 'Session does not belong to this user', code: 'AUTH_ERROR' } },
        { status: 403 }
      );
    }

    if (metadata.type !== 'domain_purchase') {
      return NextResponse.json(
        { error: { message: 'Invalid session type', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { domain, projectId } = metadata;

    if (!domain || !projectId) {
      return NextResponse.json(
        { error: { message: 'Missing purchase details', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check if already fulfilled (idempotency)
    const { data: existing } = await admin
      .from('domains')
      .select('id')
      .eq('domain', domain)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({
        data: { domain, status: 'already_fulfilled', message: 'Domain is already registered!' },
      });
    }

    // Get project info
    const { data: project } = await admin
      .from('projects')
      .select('id, vercel_project_name, published_url')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: { message: 'Project not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // 1. Purchase domain via Name.com
    const contacts: ContactInfo = {
      firstName: 'Domain',
      lastName: 'Owner',
      email: user.email || 'domains@innovatedmarketing.com',
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
      user_id: user.id,
      domain,
      domain_type: 'purchased',
      status: 'pending',
      dns_configured: true,
      namecom_order_id: String(purchaseResult.order?.orderId || ''),
      stripe_session_id: sessionId,
    });

    // 5. Update project custom_domain
    await admin
      .from('projects')
      .update({ custom_domain: domain })
      .eq('id', projectId);

    return NextResponse.json({
      data: {
        domain,
        status: 'pending',
        message: 'Domain purchased! DNS propagation typically takes 5-30 minutes.',
        orderId: purchaseResult.order?.orderId,
      },
    });
  } catch (error: unknown) {
    console.error('Domain fulfillment error:', error);
    const message = error instanceof Error ? error.message : 'Failed to complete domain purchase';
    return NextResponse.json(
      { error: { message, code: 'FULFILLMENT_ERROR' } },
      { status: 500 }
    );
  }
}

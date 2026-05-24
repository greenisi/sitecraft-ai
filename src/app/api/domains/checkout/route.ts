import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { checkAvailability } from '@/lib/domains/namecom';

/**
 * POST /api/domains/checkout  body: { domain, projectId }
 *
 * Server-validates everything. The client passes only domain + projectId —
 * the price comes from a live Name.com lookup, NOT from the request body.
 * This is the only legitimate path to start a domain purchase.
 *
 * Preconditions checked here:
 *   1. User is signed in
 *   2. They own the project AND it's published
 *   3. They have whois_contact saved on their profile (ICANN compliance)
 *   4. The domain is currently purchasable per Name.com
 *   5. Stripe is configured
 */
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

    const { domain, projectId } = await request.json();

    if (!domain || !projectId) {
      return NextResponse.json(
        { error: { message: 'Domain and project ID are required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Project ownership + must be published.
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, vercel_project_name, status, published_url')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: { message: 'Project not found or not yours', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }
    if (!project.vercel_project_name && !project.published_url) {
      return NextResponse.json(
        { error: { message: 'Project must be published first', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // ICANN-compliant WHOIS info required before any purchase.
    const { data: profile } = await supabase
      .from('profiles')
      .select('whois_contact')
      .eq('id', user.id)
      .single();

    if (!profile?.whois_contact) {
      return NextResponse.json(
        {
          error: {
            message: 'Please add your contact info before purchasing a domain.',
            code: 'WHOIS_REQUIRED',
          },
        },
        { status: 412 }  // Precondition Failed — UI prompts contact form
      );
    }

    // Live re-check availability + price at Name.com. This is the price we charge.
    const availability = await checkAvailability([domain]);
    const domainResult = availability.find(r => r.domainName === domain);
    if (!domainResult || !domainResult.purchasable) {
      return NextResponse.json(
        { error: { message: 'Domain is no longer available', code: 'DOMAIN_UNAVAILABLE' } },
        { status: 400 }
      );
    }
    const wholesalePrice = Number(domainResult.purchasePrice);
    if (!Number.isFinite(wholesalePrice) || wholesalePrice <= 0) {
      return NextResponse.json(
        { error: { message: 'Could not determine price for this domain', code: 'PRICING_ERROR' } },
        { status: 500 }
      );
    }
    // Pass-through pricing (no markup yet). Change here to add platform margin.
    const retailPriceCents = Math.round(wholesalePrice * 100);

    // Stripe sanity check.
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      return NextResponse.json(
        { error: { message: 'Payment system is not configured.', code: 'CONFIG_ERROR' } },
        { status: 503 }
      );
    }
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Domain: ${domain}`,
              description: `1-year registration. Renews at registrar's price (verify before renewal). Non-refundable after 5 days per ICANN.`,
            },
            unit_amount: retailPriceCents,
          },
          quantity: 1,
        },
      ],
      // Re-verified in the webhook against live price before we register.
      metadata: {
        type: 'domain_purchase',
        domain,
        projectId,
        userId: user.id,
        wholesalePriceCents: String(retailPriceCents),
      },
      success_url: `${appUrl}/domains/success?session_id={CHECKOUT_SESSION_ID}&domain=${encodeURIComponent(domain)}`,
      cancel_url: `${appUrl}/domains?tab=search&cancelled=true`,
    });

    return NextResponse.json({
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
        priceCents: retailPriceCents,
      },
    });
  } catch (error: unknown) {
    console.error('Domain checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json(
      { error: { message, code: 'CHECKOUT_ERROR' } },
      { status: 500 }
    );
  }
}

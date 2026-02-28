import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { checkAvailability } from '@/lib/domains/namecom';

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

    const { domain, projectId, price } = await request.json();

    if (!domain || !projectId || !price) {
      return NextResponse.json(
        { error: { message: 'Domain, project ID, and price are required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Verify project ownership and that it's published
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

    // Verify domain is still available via Name.com
    const availability = await checkAvailability([domain]);
    const domainResult = availability.find(r => r.domainName === domain);
    if (!domainResult || !domainResult.purchasable) {
      return NextResponse.json(
        { error: { message: 'Domain is no longer available', code: 'DOMAIN_UNAVAILABLE' } },
        { status: 400 }
      );
    }

    // Parse the price string (e.g. "$7.49") into cents for Stripe
    const priceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { error: { message: 'Invalid price', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }
    const priceInCents = Math.round(priceNum * 100);

    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      console.error('STRIPE_SECRET_KEY is not properly configured');
      return NextResponse.json(
        { error: { message: 'Payment system is not configured. Please contact support.', code: 'CONFIG_ERROR' } },
        { status: 503 }
      );
    }

    // Create Stripe Checkout Session
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
              description: `1-year registration for ${domain}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'domain_purchase',
        domain,
        projectId,
        userId: user.id,
        namecomPrice: String(domainResult.purchasePrice),
      },
      success_url: `${appUrl}/domains/success?session_id={CHECKOUT_SESSION_ID}&domain=${encodeURIComponent(domain)}`,
      cancel_url: `${appUrl}/domains?tab=search&cancelled=true`,
    });

    return NextResponse.json({
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
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

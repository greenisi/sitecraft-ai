import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get project owner's Stripe account
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
      return NextResponse.json({ error: 'Stripe account not found' }, { status: 400 });
    }

    // Verify session with Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { typescript: true });
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      stripeAccount: profile.stripe_account_id,
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Update order status
    const orderId = session.metadata?.order_id;
    if (orderId) {
      await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId)
        .eq('project_id', projectId);
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      payment_status: session.payment_status,
    });
  } catch (error) {
    console.error('Checkout success error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : (null as unknown as ReturnType<typeof createAdminClient>);

/**
 * POST /api/affiliates/payout
 *
 * Processes a cash payout for the authenticated affiliate via Stripe Transfer.
 * Requires the affiliate to have a connected Stripe account and sufficient pending_payout.
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get affiliate and profile in parallel
    const [affiliateResult, profileResult] = await Promise.all([
      supabase
        .from('affiliates')
        .select('id, pending_payout, payout_method')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single(),
      supabase
        .from('profiles')
        .select('stripe_connect_account_id')
        .eq('id', user.id)
        .single(),
    ]);

    const affiliate = affiliateResult.data;
    const profile = profileResult.data;

    if (!affiliate) {
      return NextResponse.json({ error: 'No active affiliate account found' }, { status: 404 });
    }

    if (affiliate.payout_method !== 'cash') {
      return NextResponse.json({ error: 'Payout method is not cash' }, { status: 400 });
    }

    if (!profile?.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'No Stripe Connect account linked. Please connect your Stripe account first.' },
        { status: 400 }
      );
    }

    const pendingAmount = parseFloat(String(affiliate.pending_payout)) || 0;
    if (pendingAmount < 10) {
      return NextResponse.json(
        { error: `Minimum payout is $10. Current balance: $${pendingAmount.toFixed(2)}` },
        { status: 400 }
      );
    }

    const amountInCents = Math.floor(pendingAmount * 100);
    const stripe = getStripe();

    // Create the Stripe Transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: 'usd',
      destination: profile.stripe_connect_account_id,
      metadata: {
        supabase_user_id: user.id,
        affiliate_id: affiliate.id,
        source: 'affiliate_payout',
      },
    });

    // Zero out pending_payout after successful transfer
    const { error: updateError } = await supabaseAdmin
      .from('affiliates')
      .update({
        pending_payout: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliate.id);

    if (updateError) {
      console.error('[payout] Failed to zero out pending_payout:', updateError);
      // Don't return error — the transfer already succeeded
    }

    console.log('[payout] Transfer complete:', {
      transferId: transfer.id,
      amount: amountInCents,
      destination: profile.stripe_connect_account_id,
    });

    return NextResponse.json({
      success: true,
      transfer_id: transfer.id,
      amount: pendingAmount,
    });
  } catch (error: unknown) {
    console.error('[payout] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process payout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

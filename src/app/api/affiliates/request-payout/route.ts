import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const MINIMUM_PAYOUT_USD = 10;

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : (null as unknown as ReturnType<typeof createAdminClient>);

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

    // Fetch the affiliate record
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, pending_payout, payout_method')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'No active affiliate account found' }, { status: 404 });
    }

    if (affiliate.payout_method !== 'cash') {
      return NextResponse.json(
        { error: 'Payout method is not set to cash' },
        { status: 400 }
      );
    }

    const pendingAmount = parseFloat(String(affiliate.pending_payout)) || 0;
    if (pendingAmount < MINIMUM_PAYOUT_USD) {
      return NextResponse.json(
        { error: `Minimum payout is $${MINIMUM_PAYOUT_USD}. Current balance: $${pendingAmount.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Check that a Stripe Connect account is linked
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'Please connect your Stripe account before requesting a payout' },
        { status: 400 }
      );
    }

    // Mark payout as requested by recording it (zero out pending, the payout
    // endpoint will process the actual Stripe Transfer).
    // We track the requested amount so the admin payout endpoint can process it.
    const { error: updateError } = await supabaseAdmin
      .from('affiliates')
      .update({
        pending_payout: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliate.id);

    if (updateError) {
      console.error('[request-payout] Failed to update affiliate:', updateError);
      return NextResponse.json({ error: 'Failed to record payout request' }, { status: 500 });
    }

    // Immediately process via the payout endpoint logic (Stripe Transfer)
    const stripeModule = await import('@/lib/stripe');
    const stripe = stripeModule.getStripe();

    const amountInCents = Math.floor(pendingAmount * 100);

    try {
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

      console.log('[request-payout] Stripe Transfer created:', transfer.id, 'amount:', amountInCents);

      return NextResponse.json({
        success: true,
        amount: pendingAmount,
        transfer_id: transfer.id,
      });
    } catch (stripeError: unknown) {
      // Restore pending_payout on Stripe failure
      await supabaseAdmin
        .from('affiliates')
        .update({ pending_payout: pendingAmount, updated_at: new Date().toISOString() })
        .eq('id', affiliate.id);

      console.error('[request-payout] Stripe Transfer failed:', stripeError);
      const message =
        stripeError instanceof Error ? stripeError.message : 'Stripe transfer failed';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('[request-payout] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to request payout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

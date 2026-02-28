import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/referral/track-click
 * Tracks when someone clicks a referral link
 * Called from the frontend when a user lands with a ref parameter
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json({ error: 'Missing referralCode' }, { status: 400 });
    }

    // Find the referrer by their referral code
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Record the click event
    await supabaseAdmin.from('referral_events').insert({
      referrer_id: referrer.id,
      event_type: 'click',
    });

    // Update referral stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('referral_stats')
      .select('clicks')
      .eq('referrer_id', referrer.id)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('[ReferralClick] Error fetching stats:', statsError);
    }

    if (stats) {
      await supabaseAdmin
        .from('referral_stats')
        .update({
          clicks: (stats.clicks || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('referrer_id', referrer.id);
    } else {
      await supabaseAdmin.from('referral_stats').insert({
        referrer_id: referrer.id,
        clicks: 1,
      });
    }

    console.log('[ReferralClick] Tracked click for referrer:', referrer.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ReferralClick] Error:', err);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}

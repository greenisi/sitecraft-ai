import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/referral/stats
 * Returns the referral statistics for the authenticated user
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's referral code
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    // Get referral stats
    const { data: stats } = await supabaseAdmin
      .from('referral_stats')
      .select('clicks, signups, conversions, total_earnings')
      .eq('referrer_id', user.id)
      .single();

    // Get recent referral events
    const { data: recentEvents } = await supabaseAdmin
      .from('referral_events')
      .select('event_type, conversion_amount, created_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';
    const referralLink = profile?.referral_code 
      ? `${baseUrl}?ref=${profile.referral_code}`
      : null;

    return NextResponse.json({
      referralCode: profile?.referral_code || null,
      referralLink,
      stats: {
        clicks: stats?.clicks || 0,
        signups: stats?.signups || 0,
        conversions: stats?.conversions || 0,
        totalEarnings: parseFloat(stats?.total_earnings) || 0,
      },
      recentEvents: recentEvents || [],
    });
  } catch (err) {
    console.error('[ReferralStats] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/auth/callback
 * Handles the OAuth callback from Supabase Auth
 * FIX 3: Captures the referral code from the URL and links the referred user
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  
  // Get referral code from state or stored cookie
  const refCode = request.cookies.get('referral_code')?.value;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if this is a new user signup by checking if profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, referred_by')
        .eq('id', data.user.id)
        .single();

      // If user was referred and not already linked to a referrer
      if (refCode && existingProfile && !existingProfile.referred_by) {
        await processReferral(data.user.id, refCode);
      }
    }
  }

  // Clear the referral cookie and redirect
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  response.cookies.delete('referral_code');
  return response;
}

/**
 * Process a referral signup
 */
async function processReferral(newUserId: string, referralCode: string) {
  try {
    // Find the affiliate by their affiliate_code in the affiliates table
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('id, user_id, total_signups')
      .eq('affiliate_code', referralCode.toUpperCase())
      .single();

    if (!affiliate || affiliateError) {
      console.log('[AuthCallback] Affiliate code not found:', referralCode);
      return;
    }

    // Don't allow self-referral
    if (affiliate.user_id === newUserId) {
      console.log('[AuthCallback] Self-referral attempted, ignoring');
      return;
    }

    // Update the new user's profile with the referrer's user_id
    await supabaseAdmin
      .from('profiles')
      .update({ referred_by: affiliate.user_id })
      .eq('id', newUserId);

    // Get the new user's email for the referral record
    const { data: newUser } = await supabaseAdmin.auth.admin.getUserById(newUserId);
    const referredEmail = newUser?.user?.email || null;

    // Update the most recent 'clicked' referral entry to 'signed_up', or create new one
    const { data: existingReferral } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'clicked')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingReferral) {
      await supabaseAdmin
        .from('referrals')
        .update({
          referred_email: referredEmail,
          referred_user_id: newUserId,
          status: 'signed_up',
          signed_up_at: new Date().toISOString(),
        })
        .eq('id', existingReferral.id);
    } else {
      await supabaseAdmin.from('referrals').insert({
        affiliate_id: affiliate.id,
        referred_email: referredEmail,
        referred_user_id: newUserId,
        status: 'signed_up',
        signed_up_at: new Date().toISOString(),
        reward_type: 'free_month',
        reward_value: 1,
      });
    }

    // Update affiliate signup count
    await supabaseAdmin
      .from('affiliates')
      .update({
        total_signups: (affiliate.total_signups || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliate.id);

    console.log('[AuthCallback] Processed referral signup', {
      affiliateId: affiliate.id,
      referrerUserId: affiliate.user_id,
      newUserId,
      referralCode,
    });
  } catch (err) {
    console.error('[AuthCallback] Error processing referral:', err);
  }
}

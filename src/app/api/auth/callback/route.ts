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
    // Find the referrer
    const { data: referrer } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (!referrer) {
      console.log('[AuthCallback] Referral code not found:', referralCode);
      return;
    }

    // Don't allow self-referral
    if (referrer.id === newUserId) {
      console.log('[AuthCallback] Self-referral attempted, ignoring');
      return;
    }

    // Update the new user's profile with the referrer
    await supabaseAdmin
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId);

    // Record the signup event
    await supabaseAdmin.from('referral_events').insert({
      referrer_id: referrer.id,
      referred_user_id: newUserId,
      event_type: 'signup',
    });

    // Update referral stats
    const { data: stats } = await supabaseAdmin
      .from('referral_stats')
      .select('signups')
      .eq('referrer_id', referrer.id)
      .single();

    if (stats) {
      await supabaseAdmin
        .from('referral_stats')
        .update({
          signups: (stats.signups || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('referrer_id', referrer.id);
    } else {
      await supabaseAdmin.from('referral_stats').insert({
        referrer_id: referrer.id,
        signups: 1,
      });
    }

    console.log('[AuthCallback] Processed referral signup', {
      referrerId: referrer.id,
      newUserId,
      referralCode,
    });
  } catch (err) {
    console.error('[AuthCallback] Error processing referral:', err);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, password, displayName } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // FIX: Read referral code from cookie
  const referralCode = request.cookies.get('referral_code')?.value;
  console.log('[Signup] Referral code from cookie:', referralCode);

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName?.trim() || '',
        full_name: displayName?.trim() || '',
      },
    });

    if (error) {
      // Handle duplicate email
      if (error.message.includes('already') || error.message.includes('exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // FIX: Process referral after successful signup
    if (referralCode && data.user) {
      await processReferral(supabase, data.user.id, referralCode);
    }

    // Clear the referral cookie by setting an expired cookie in the response
    const response = NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
    });
    
    if (referralCode) {
      response.cookies.set('referral_code', '', {
        maxAge: 0,
        path: '/',
      });
    }

    return response;
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Process a referral signup - link the new user to their referrer
 */
async function processReferral(supabase: ReturnType<typeof createAdminClient>, newUserId: string, referralCode: string) {
  try {
    console.log('[Signup] Processing referral:', { newUserId, referralCode });

    // Find the affiliate by their affiliate_code in the affiliates table
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, user_id, total_signups')
      .eq('affiliate_code', referralCode.toUpperCase())
      .single();

    if (affiliateError || !affiliate) {
      console.log('[Signup] Affiliate code not found:', referralCode);
      return;
    }

    // Don't allow self-referral
    if (affiliate.user_id === newUserId) {
      console.log('[Signup] Self-referral attempted, ignoring');
      return;
    }

    // Update the new user's profile with the affiliate's ID
    // NOTE: referred_by FK references affiliates(id), not profiles(id)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ referred_by: affiliate.id })
      .eq('id', newUserId);

    if (updateError) {
      console.error('[Signup] Failed to update referred_by:', updateError);
      // Don't return - still try to update affiliate stats
    }

    // Get the new user's email for the referral record
    const { data: newUser } = await supabase.auth.admin.getUserById(newUserId);
    const referredEmail = newUser?.user?.email || null;

    // Update the most recent 'clicked' referral entry to 'signed_up', or create new one
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'clicked')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingReferral) {
      await supabase
        .from('referrals')
        .update({
          referred_email: referredEmail,
          referred_user_id: newUserId,
          status: 'signed_up',
          signed_up_at: new Date().toISOString(),
        })
        .eq('id', existingReferral.id);
    } else {
      await supabase.from('referrals').insert({
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
    await supabase
      .from('affiliates')
      .update({
        total_signups: (affiliate.total_signups || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliate.id);

    console.log('[Signup] Successfully processed referral:', {
      affiliateId: affiliate.id,
      referrerUserId: affiliate.user_id,
      newUserId,
      referralCode,
    });
  } catch (err) {
    console.error('[Signup] Error processing referral:', err);
  }
}

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

    // Find the referrer by their referral code
    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      console.log('[Signup] Referral code not found:', referralCode);
      return;
    }

    // Don't allow self-referral
    if (referrer.id === newUserId) {
      console.log('[Signup] Self-referral attempted, ignoring');
      return;
    }

    // Update the new user's profile with the referrer
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId);

    if (updateError) {
      console.error('[Signup] Failed to update referred_by:', updateError);
      return;
    }

    // Record the signup event
    const { error: eventError } = await supabase.from('referral_events').insert({
      referrer_id: referrer.id,
      referred_user_id: newUserId,
      event_type: 'signup',
    });

    if (eventError) {
      console.error('[Signup] Failed to record signup event:', eventError);
    }

    // Update referral stats
    const { data: stats } = await supabase
      .from('referral_stats')
      .select('signups')
      .eq('referrer_id', referrer.id)
      .single();

    if (stats) {
      await supabase
        .from('referral_stats')
        .update({
          signups: (stats.signups || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('referrer_id', referrer.id);
    } else {
      await supabase.from('referral_stats').insert({
        referrer_id: referrer.id,
        signups: 1,
      });
    }

    console.log('[Signup] Successfully processed referral:', {
      referrerId: referrer.id,
      newUserId,
      referralCode,
    });
  } catch (err) {
    console.error('[Signup] Error processing referral:', err);
  }
}

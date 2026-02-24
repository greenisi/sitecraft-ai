import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/affiliates/track - Track a referral click
export async function POST(request: NextRequest) {
  try {
    const { ref_code, source } = await request.json();

    if (!ref_code) {
      return NextResponse.json({ error: 'Missing ref_code' }, { status: 400 });
    }

    // Find the affiliate by code
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('affiliate_code', ref_code)
      .eq('status', 'active')
      .single();

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Create a referral click record
    await supabaseAdmin.from('referrals').insert({
      affiliate_id: affiliate.id,
      status: 'clicked',
      click_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      click_user_agent: request.headers.get('user-agent') || 'unknown',
      click_source: source || 'direct',
    });

    // Increment click count
    await supabaseAdmin.rpc('increment_affiliate_clicks', { aff_id: affiliate.id }).catch(() => {
      // Fallback if RPC doesn't exist
      supabaseAdmin
        .from('affiliates')
        .update({ total_clicks: (affiliate as any).total_clicks + 1 })
        .eq('id', affiliate.id);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Referral tracking error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/affiliates/track?ref=CODE - Redirect handler for referral links
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');

  if (!ref) {
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  // Find the affiliate
  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('id')
    .eq('affiliate_code', ref)
    .eq('status', 'active')
    .single();

  if (affiliate) {
    // Create click record
    await supabaseAdmin.from('referrals').insert({
      affiliate_id: affiliate.id,
      status: 'clicked',
      click_ip: request.headers.get('x-forwarded-for') || 'unknown',
      click_user_agent: request.headers.get('user-agent') || 'unknown',
      click_source: 'link',
    });

    // Increment clicks
    await supabaseAdmin
      .from('affiliates')
      .update({ total_clicks: (affiliate as any).total_clicks ? (affiliate as any).total_clicks + 1 : 1 })
      .eq('id', affiliate.id);
  }

  // Redirect to signup with ref param stored
  const redirectUrl = new URL('/signup', request.url);
  redirectUrl.searchParams.set('ref', ref);
  
  const response = NextResponse.redirect(redirectUrl);
  // Set cookie for 30 days
  response.cookies.set('ref_code', ref, {
    maxAge: 30 * 24 * 60 * 60,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });

  return response;
}

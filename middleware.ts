import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@supabase/supabase-js';

// Direct database client for click tracking (more reliable than internal fetch)
function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function middleware(request: NextRequest) {
  // Get the response from the session update
  const response = await updateSession(request);
  
  // FIX 3: Capture referral code from URL and store in cookie
  const refCode = request.nextUrl.searchParams.get('ref');
  
  if (refCode && !request.cookies.get('referral_code')) {
    console.log('[Middleware] Capturing referral code:', refCode);
    
    // Store the referral code in a cookie for 30 days
    // This persists through the signup flow
    const newResponse = response || NextResponse.next();
    newResponse.cookies.set('referral_code', refCode.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    // FIX: Track click directly in database using affiliates table
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        // Find the affiliate by their affiliate_code in the affiliates table
        const { data: affiliate, error: affiliateError } = await supabase
          .from('affiliates')
          .select('id, user_id, total_clicks')
          .eq('affiliate_code', refCode.toUpperCase())
          .single();

        if (affiliate && !affiliateError) {
          // Update click count in affiliates table
          await supabase
            .from('affiliates')
            .update({
              total_clicks: (affiliate.total_clicks || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', affiliate.id);

          // Create a referral entry for tracking
          await supabase.from('referrals').insert({
            affiliate_id: affiliate.id,
            status: 'clicked',
            reward_type: 'free_month',
            reward_value: 1,
          });

          console.log('[Middleware] Tracked referral click for affiliate:', affiliate.id);
        } else {
          console.log('[Middleware] Invalid affiliate code:', refCode, affiliateError?.message);
        }
      } catch (err) {
        console.error('[Middleware] Error tracking click:', err);
      }
    }
    
    return newResponse;
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * 
     * This ensures middleware runs on:
     * - All page routes
     * - All API routes (for session refresh)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

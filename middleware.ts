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
    
    // FIX: Track click directly in database (more reliable than internal fetch)
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        // Find the referrer by their referral code
        const { data: referrer, error: referrerError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', refCode.toUpperCase())
          .single();

        if (referrer && !referrerError) {
          // Record the click event
          await supabase.from('referral_events').insert({
            referrer_id: referrer.id,
            event_type: 'click',
          });

          // Update or create referral stats
          const { data: stats } = await supabase
            .from('referral_stats')
            .select('clicks')
            .eq('referrer_id', referrer.id)
            .single();

          if (stats) {
            await supabase
              .from('referral_stats')
              .update({
                clicks: (stats.clicks || 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('referrer_id', referrer.id);
          } else {
            await supabase.from('referral_stats').insert({
              referrer_id: referrer.id,
              clicks: 1,
            });
          }

          console.log('[Middleware] Tracked referral click for:', referrer.id);
        } else {
          console.log('[Middleware] Invalid referral code:', refCode, referrerError?.message);
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

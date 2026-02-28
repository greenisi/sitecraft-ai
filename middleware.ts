import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Get the response from the session update
  const response = await updateSession(request);
  
  // FIX 3: Capture referral code from URL and store in cookie
  const refCode = request.nextUrl.searchParams.get('ref');
  
  if (refCode && !request.cookies.get('referral_code')) {
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
    
    // Track the click asynchronously (non-blocking)
    // We use a simple fetch here; in production you might want to use a queue
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      fetch(`${request.nextUrl.origin}/api/referral/track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: refCode }),
      }).catch(() => {
        // Silently fail - don't block the request
      });
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

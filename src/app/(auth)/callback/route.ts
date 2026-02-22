import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
    const next = searchParams.get('next') || searchParams.get('redirect') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Create the redirect response
      const redirectResponse = NextResponse.redirect(`${origin}${next}`);

      // Copy all cookies from the cookie store onto the redirect response
      // so auth session cookies set by exchangeCodeForSession are not lost
      const cookieStore = await cookies();
      cookieStore.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      });

      return redirectResponse;
    }
  }

  // If there's no code or the exchange failed, redirect to login with an error
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
  );
}

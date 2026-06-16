import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// OAuth / password-recovery callback. Exchanges the PKCE code for a session.
//
// IMPORTANT: the session cookies MUST be written with @supabase/ssr's own
// cookie options (which are NOT httpOnly) so the browser-side Supabase client
// can read them. A previous version forced `httpOnly: true` here, which made
// the session invisible to the browser client — server routes worked (they
// read cookies server-side) but every client-rendered page (dashboard,
// billing, anything using useUser) hung forever because getUser() returned
// null. Writing cookies straight onto the redirect response with the options
// Supabase provides is the canonical pattern and fixes that.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || searchParams.get('redirect') || '/dashboard';

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    );
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Write the session cookies onto the redirect response using the
          // options Supabase supplies (browser-readable — no forced httpOnly).
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[Auth Callback] exchangeCodeForSession failed:', error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    );
  }

  return response;
}

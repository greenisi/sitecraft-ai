import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // Create initial response with the request
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Set cookies on the request for downstream handlers
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Create a new response with the modified request
          supabaseResponse = NextResponse.next({
            request,
          });
          // Also set cookies on the response for the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — redirect to login if not authenticated
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/projects') ||
    request.nextUrl.pathname.startsWith('/templates') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/admin');

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

    // Admin route protection
    if (request.nextUrl.pathname.startsWith('/admin') && user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (!profile || profile.role !== 'admin') {
                  const url = request.nextUrl.clone();
                  url.pathname = '/dashboard';
                  return NextResponse.redirect(url);
          }
    }
  // Redirect authenticated users away from auth pages
  const isAuthRoute =
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup';

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

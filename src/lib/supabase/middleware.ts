import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
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

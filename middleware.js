import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { hasAwarenessAccess } from '@/lib/awareness-access';

export async function middleware(request) {
  let response = NextResponse.next({ request });
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey,
    {
      db: { schema: 'awareness' },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const hasAccess = hasAwarenessAccess(user);
  const path = request.nextUrl.pathname;
  const isProtectedPage = path === '/portal' || path.startsWith('/portal/');

  if ((!user || !hasAccess) && isProtectedPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('next', `${path}${request.nextUrl.search}`);
    if (user && !hasAccess) loginUrl.searchParams.set('error', 'invite-required');
    return NextResponse.redirect(loginUrl);
  }

  if (user && hasAccess && path === '/login') {
    const portalUrl = request.nextUrl.clone();
    portalUrl.pathname = '/portal';
    portalUrl.search = '';
    return NextResponse.redirect(portalUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { safeNextPath } from '@/lib/auth-redirect';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('error', 'expired');
  loginUrl.searchParams.set('next', next);
  return NextResponse.redirect(loginUrl);
}

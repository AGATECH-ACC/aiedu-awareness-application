import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase client bound to the request cookies.
// Use inside Server Components, Route Handlers, and Server Actions.
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
}

'use client';

import { createClient } from '@supabase/supabase-js';

let browserClient;

// Invite and recovery links intentionally use Supabase's client-only implicit
// flow. Normal password sign-in continues to use the cookie-bound SSR client.
export function createImplicitAuthClient() {
  if (typeof window === 'undefined') {
    throw new Error('implicit_auth_client_requires_browser');
  }
  if (browserClient) return browserClient;

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey,
    {
      db: { schema: 'awareness' },
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
        persistSession: true,
        storageKey: 'awareness-password-link',
      },
    }
  );

  return browserClient;
}

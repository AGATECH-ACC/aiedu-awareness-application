import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function supabaseSecretKey() {
  return process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || '';
}

export function createAdminSupabase() {
  const key = supabaseSecretKey();
  if (!key) {
    throw new Error('supabase_secret_key_missing');
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    db: { schema: 'awareness' },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

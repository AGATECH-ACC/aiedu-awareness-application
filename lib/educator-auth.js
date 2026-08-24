import 'server-only';
import { hasAwarenessAccess } from '@/lib/awareness-access';
import { createServerSupabase } from '@/lib/supabase-server';
import { getProfile } from '@/lib/db';

export async function getEducatorRequestContext() {
  const supabase = createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { status: 401, error: 'unauthorized' };
  if (!hasAwarenessAccess(user)) return { status: 403, error: 'awareness_access_required' };

  const profile = await getProfile(supabase, user.id);
  if (profile?.role !== 'educator') {
    return { status: 403, error: 'educator_required' };
  }

  return { supabase, user, profile };
}

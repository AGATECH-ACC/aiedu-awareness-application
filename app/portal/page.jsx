import { redirect } from 'next/navigation';
import TopNav from '@/components/TopNav';
import PortalClient from './PortalClient';
import { createServerSupabase } from '@/lib/supabase-server';
import { listReports } from '@/lib/db';
import { getProfile } from '@/lib/db';

export default async function PortalPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/portal');

  let reports = [];
  try {
    reports = await listReports(supabase, 20);
  } catch (error) {
    console.error('Unable to load report history', error);
  }

  const requirePlan = process.env.NEXT_PUBLIC_REQUIRE_PLAN === 'true';
  let plan = 'free';
  if (requirePlan) {
    try {
      const profile = await getProfile(supabase, user.id);
      plan = profile?.plan || 'free';
    } catch (error) {
      console.error('Unable to load profile plan', error);
    }
  }

  return (
    <main style={{ background: 'radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)', minHeight: '100vh' }}>
      <TopNav user={user} />
      <PortalClient userId={user.id} email={user.email} initialReports={reports} requirePlan={requirePlan} plan={plan} />
    </main>
  );
}

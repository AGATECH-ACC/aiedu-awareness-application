import { redirect } from 'next/navigation';
import TopNav from '@/components/TopNav';
import EducatorPortal from './EducatorPortal';
import PortalClient from './PortalClient';
import { hasAwarenessAccess } from '@/lib/awareness-access';
import { createServerSupabase } from '@/lib/supabase-server';
import { getProfile, listEducatorDeliveries, listReports } from '@/lib/db';

export default async function PortalPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !hasAwarenessAccess(user)) redirect('/login?next=/portal&error=invite-required');

  let profile = null;
  try {
    profile = await getProfile(supabase, user.id);
  } catch (error) {
    console.error('Unable to load awareness profile', error);
  }

  const requirePlan = process.env.NEXT_PUBLIC_REQUIRE_PLAN === 'true';
  if (profile?.role === 'educator') {
    let ownReports = [];
    let deliveries = [];
    try {
      [ownReports, deliveries] = await Promise.all([
        listReports(supabase, { limit: 40, userId: user.id }),
        listEducatorDeliveries(supabase, 100),
      ]);
    } catch (error) {
      console.error('Unable to load educator portal data', error);
    }

    return (
      <div className="educator-admin-root">
        <EducatorPortal
          userId={user.id}
          email={user.email}
          ownReports={ownReports}
          deliveries={deliveries}
          requirePlan={requirePlan}
          plan={profile?.plan || 'free'}
        />
      </div>
    );
  }

  let reports = [];
  try {
    reports = await listReports(supabase, { limit: 20, userId: user.id });
  } catch (error) {
    console.error('Unable to load report history', error);
  }

  return (
    <main style={{ background: 'radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)', minHeight: '100vh' }}>
      <TopNav user={user} chineseOnly />
      <PortalClient userId={user.id} email={user.email} initialReports={reports} requirePlan={requirePlan} plan={profile?.plan || 'free'} />
    </main>
  );
}

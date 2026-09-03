import { redirect } from 'next/navigation';
import TopNav from '@/components/TopNav';
import EducatorPortal from './EducatorPortal';
import PortalClient from './PortalClient';
import { hasAwarenessAccess } from '@/lib/awareness-access';
import { createServerSupabase } from '@/lib/supabase-server';
import { getEducatorQualifyingReportCount, getProfile, listEducatorDeliveries, listReports } from '@/lib/db';

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
    let qualifyingReportCount = null;
    const [reportsResult, deliveriesResult, milestoneResult] = await Promise.allSettled([
      listReports(supabase, { limit: 40, userId: user.id }),
      listEducatorDeliveries(supabase, 100),
      getEducatorQualifyingReportCount(supabase),
    ]);
    if (reportsResult.status === 'fulfilled') ownReports = reportsResult.value;
    else console.error('Unable to load educator reports', reportsResult.reason);
    if (deliveriesResult.status === 'fulfilled') deliveries = deliveriesResult.value;
    else console.error('Unable to load educator deliveries', deliveriesResult.reason);
    if (milestoneResult.status === 'fulfilled') qualifyingReportCount = milestoneResult.value;
    else console.error('Unable to load educator milestone', milestoneResult.reason);

    return (
      <div className="educator-admin-root">
        <EducatorPortal
          userId={user.id}
          email={user.email}
          ownReports={ownReports}
          deliveries={deliveries}
          qualifyingReportCount={qualifyingReportCount}
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

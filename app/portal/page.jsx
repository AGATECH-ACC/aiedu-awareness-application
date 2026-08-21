import { redirect } from 'next/navigation';
import TopNav from '@/components/TopNav';
import PortalClient from './PortalClient';
import { createServerSupabase } from '@/lib/supabase-server';
import { listReports } from '@/lib/db';
import '../globals.css';

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

  return (
    <main style={{ background: 'radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)', minHeight: '100vh' }}>
      <TopNav user={user} />
      <PortalClient email={user.email} initialReports={reports} />
    </main>
  );
}

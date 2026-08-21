import { redirect } from 'next/navigation';
import TopNav from '@/components/TopNav';
import PortalClient from './PortalClient';
import { createServerSupabase } from '@/lib/supabase-server';
import '../globals.css';

export default async function PortalPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/portal');

  const { data: reports } = await supabase
    .from('deep_reports')
    .select('id, content, created_at, reading_id, readings ( mode, spread_key, cards )')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main style={{ background: 'radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)', minHeight: '100vh' }}>
      <TopNav user={user} />
      <PortalClient email={user.email} initialReports={reports || []} />
    </main>
  );
}

import { notFound, redirect } from 'next/navigation';
import TopNav from '@/components/TopNav';
import { hasAwarenessAccess } from '@/lib/awareness-access';
import { getProfile } from '@/lib/db';
import { createServerSupabase } from '@/lib/supabase-server';
import AccountInviteForm from './AccountInviteForm';

export const metadata = {
  title: '邀请教育者账户 · Invite Educator',
  robots: { index: false, follow: false },
};

export default async function NewAccountPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !hasAwarenessAccess(user)) redirect('/login?next=/portal/accounts/new&error=invite-required');

  let profile;
  try {
    profile = await getProfile(supabase, user.id);
  } catch (error) {
    console.error('Unable to authorize account invitation page', error);
    notFound();
  }
  if (profile?.role !== 'educator') notFound();

  return (
    <main className="account-invite-page">
      <TopNav user={user} variant="card" />
      <div className="account-invite-shell">
        <AccountInviteForm />
      </div>
    </main>
  );
}

import LoginClient from './LoginClient';
import { safeNextPath } from '@/lib/auth-redirect';

export default function LoginPage({ searchParams }) {
  return (
    <LoginClient
      nextPath={safeNextPath(searchParams?.next)}
      initialStatus={searchParams?.status === 'password-set' ? 'password-set' : ''}
      initialError={searchParams?.error === 'invite-required' ? 'invite-required' : ''}
    />
  );
}

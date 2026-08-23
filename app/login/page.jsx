import LoginClient from './LoginClient';
import { safeNextPath } from '@/lib/auth-redirect';

export default function LoginPage({ searchParams }) {
  return (
    <LoginClient
      nextPath={safeNextPath(searchParams?.next)}
      initialError={searchParams?.error === 'expired' ? 'expired' : ''}
      initialMode="signin"
    />
  );
}

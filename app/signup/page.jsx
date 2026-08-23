import LoginClient from '../login/LoginClient';
import { safeNextPath } from '@/lib/auth-redirect';

export const metadata = {
  title: '创建账户 · Create Account',
};

export default function SignupPage({ searchParams }) {
  return (
    <LoginClient
      nextPath={safeNextPath(searchParams?.next)}
      initialError={searchParams?.error === 'expired' ? 'expired' : ''}
      initialMode="signup"
    />
  );
}

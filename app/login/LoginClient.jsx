'use client';

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { SignIn } from '@phosphor-icons/react/SignIn';
import { useState } from 'react';
import AuthShell from '@/components/AuthShell';
import { hasAwarenessAccess } from '@/lib/awareness-access';
import { ACCESS_REQUIRED_MESSAGE, loginErrorMessage } from '@/lib/auth-errors';
import { createClient } from '@/lib/supabase-browser';

export default function LoginClient({ nextPath, initialStatus, initialError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(initialError === 'invite-required' ? ACCESS_REQUIRED_MESSAGE : '');
  const [busy, setBusy] = useState(false);

  async function signIn(event) {
    event.preventDefault();
    setErr('');
    setBusy(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErr(loginErrorMessage(error));
        return;
      }

      if (!hasAwarenessAccess(data.user)) {
        await supabase.auth.signOut({ scope: 'local' });
        setErr(ACCESS_REQUIRED_MESSAGE);
        return;
      }

      window.location.assign(nextPath);
    } catch (error) {
      setErr(loginErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-heading">
        <strong>欢迎回来</strong>
        <span lang="en">Welcome back</span>
      </div>

      {initialStatus === 'password-set' ? (
        <div className="auth-notice" role="status">
          密码已设定。现在可以使用电邮和密码登入。<br />
          <span lang="en">Your password is ready. Sign in with your email and password.</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={signIn}>
        <div className="auth-field">
          <label htmlFor="login-email">电邮 · Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="auth-field">
          <div className="auth-field-label-row">
            <label htmlFor="login-password">密码 · Password</label>
            <Link href="/forgot-password">忘记密码？ · Forgot password?</Link>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
          />
        </div>

        <button className="auth-submit" type="submit" disabled={busy || !email.trim() || !password}>
          <SignIn size={24} weight="regular" aria-hidden="true" />
          <span>{busy ? '登入中… · Signing in…' : '登入 · Sign in'}</span>
        </button>

        <p className="auth-help">
          账户只限私人邀请开通。如尚未有账户，请联系你的教育者。<br />
          <span lang="en">Accounts are invitation-only. If you do not have one, ask your educator for an invitation.</span>
        </p>
      </form>

      {err ? <div className="auth-alert" role="alert">{err}</div> : null}

      <Link className="auth-back" href="/">
        <ArrowLeft size={18} aria-hidden="true" />
        <span>返回觉察卡 · Back to the cards</span>
      </Link>
    </AuthShell>
  );
}

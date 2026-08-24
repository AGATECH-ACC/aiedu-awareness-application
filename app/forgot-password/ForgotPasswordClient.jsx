'use client';

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { CheckCircle } from '@phosphor-icons/react/CheckCircle';
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple';
import { useState } from 'react';
import AuthShell from '@/components/AuthShell';
import { passwordEmailErrorMessage } from '@/lib/auth-errors';
import { createImplicitAuthClient } from '@/lib/supabase-implicit-auth';

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function requestReset(event) {
    event.preventDefault();
    setErr('');
    setBusy(true);

    try {
      const supabase = createImplicitAuthClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/set-password` }
      );

      if (error) {
        setErr(passwordEmailErrorMessage(error));
        return;
      }

      setSent(true);
    } catch (error) {
      setErr(passwordEmailErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-heading">
        <strong>重设密码</strong>
        <span lang="en">Reset your password</span>
      </div>

      {sent ? (
        <div className="auth-sent" role="status">
          <CheckCircle size={38} weight="duotone" aria-hidden="true" />
          <strong>请检查你的电邮。</strong>
          <span lang="en">If an invited account exists for {email.trim()}, a password reset link has been sent.</span>
          <p>为了保护账户安全，我们不会确认此电邮是否已有账户。<br />We do not confirm whether an account exists for this email.</p>
          <button type="button" onClick={() => { setSent(false); setEmail(''); }}>
            使用其他电邮 · Use another email
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={requestReset}>
          <p className="auth-intro">
            输入受邀账户的电邮，我们会寄出安全的密码重设连结。<br />
            <span lang="en">Enter the email for your invited account and we will send a secure password reset link.</span>
          </p>

          <div className="auth-field">
            <label htmlFor="reset-email">电邮 · Email</label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <button className="auth-submit" type="submit" disabled={busy || !email.trim()}>
            <EnvelopeSimple size={24} aria-hidden="true" />
            <span>{busy ? '寄送中… · Sending…' : '寄出重设连结 · Send reset link'}</span>
          </button>
        </form>
      )}

      {err ? <div className="auth-alert" role="alert">{err}</div> : null}

      <Link className="auth-back" href="/login">
        <ArrowLeft size={18} aria-hidden="true" />
        <span>返回登入 · Back to sign in</span>
      </Link>
    </AuthShell>
  );
}

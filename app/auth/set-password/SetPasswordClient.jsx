'use client';

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { LockKey } from '@phosphor-icons/react/LockKey';
import { useEffect, useRef, useState } from 'react';
import AuthShell from '@/components/AuthShell';
import PasswordInput from '@/components/PasswordInput';
import {
  EXPIRED_PASSWORD_LINK_MESSAGE,
  updatePasswordErrorMessage,
} from '@/lib/auth-errors';
import { createImplicitAuthClient } from '@/lib/supabase-implicit-auth';

export default function SetPasswordClient() {
  const clientRef = useRef(null);
  const [status, setStatus] = useState('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hash.get('error') || hash.get('error_code')) {
      setErr(EXPIRED_PASSWORD_LINK_MESSAGE);
      setStatus('invalid');
      return undefined;
    }

    const supabase = createImplicitAuthClient();
    clientRef.current = supabase;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session && ['INITIAL_SESSION', 'SIGNED_IN', 'PASSWORD_RECOVERY'].includes(event)) {
        setErr('');
        setStatus('ready');
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.session) {
        setErr(EXPIRED_PASSWORD_LINK_MESSAGE);
        setStatus('invalid');
      } else {
        setStatus('ready');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function setNewPassword(event) {
    event.preventDefault();
    setErr('');

    if (password.length < 8) {
      setErr('密码必须至少有 8 个字符。 · Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setErr('两次输入的密码不一致。 · The passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const supabase = clientRef.current;
      if (!supabase) {
        setErr(EXPIRED_PASSWORD_LINK_MESSAGE);
        setStatus('invalid');
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const message = updatePasswordErrorMessage(error);
        setErr(message);
        if (message === EXPIRED_PASSWORD_LINK_MESSAGE) setStatus('invalid');
        return;
      }

      await supabase.auth.signOut({ scope: 'local' });
      window.location.replace('/login?status=password-set');
    } catch (error) {
      setErr(updatePasswordErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-heading">
        <strong>设定你的密码</strong>
        <span lang="en">Set your password</span>
      </div>

      {status === 'checking' ? (
        <div className="auth-checking" role="status">
          正在验证安全连结… · Verifying your secure link…
        </div>
      ) : status === 'ready' ? (
        <form className="auth-form" onSubmit={setNewPassword}>
          <p className="auth-intro">
            请输入新密码。完成后，请在登入页使用电邮和新密码登入。<br />
            <span lang="en">Choose a new password. When complete, sign in with your email and new password.</span>
          </p>

          <div className="auth-field">
            <label htmlFor="new-password">新密码 · New password</label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password">确认密码 · Confirm password</label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Enter the same password again"
            />
          </div>

          <button className="auth-submit" type="submit" disabled={busy || !password || !confirmation}>
            <LockKey size={24} aria-hidden="true" />
            <span>{busy ? '储存中… · Saving…' : '储存密码 · Save password'}</span>
          </button>
        </form>
      ) : (
        <div className="auth-link-actions">
          <Link href="/forgot-password">申请新重设连结 · Request a new reset link</Link>
          <p>如果这是新账户邀请，请联系教育者重新寄出。<br />If this was a new-account invitation, ask your educator to send another one.</p>
        </div>
      )}

      {err ? <div className="auth-alert" role="alert">{err}</div> : null}

      <Link className="auth-back" href="/login">
        <ArrowLeft size={18} aria-hidden="true" />
        <span>返回登入 · Back to sign in</span>
      </Link>
    </AuthShell>
  );
}

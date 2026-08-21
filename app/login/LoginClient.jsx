'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

const EXPIRED_MESSAGE = '登入连结已过期或无效，请重新申请。 · This sign-in link has expired or is invalid. Please request a new one.';
const GOOGLE_MESSAGE = 'Google 登入暂时无法使用，请改用电邮登入。 · Google sign-in is unavailable. Please use the email link instead.';

export default function LoginClient({ nextPath, initialError }) {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(initialError === 'expired' ? EXPIRED_MESSAGE : '');
  const [busy, setBusy] = useState('');
  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';

  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || '');
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  async function sendLink(event) {
    event.preventDefault();
    setErr('');
    setBusy('email');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl },
    });
    setBusy('');
    if (error) {
      setErr('登入连结寄送失败，请稍后再试。 · We could not send the sign-in link. Please try again.');
    } else {
      setSent(true);
    }
  }

  async function google() {
    if (!googleEnabled) return;
    setErr('');
    setBusy('google');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setBusy('');
      setErr(GOOGLE_MESSAGE);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fffdf8', border: '1px solid #e6d9bd', borderRadius: 20, padding: 28, boxShadow: '0 8px 30px rgba(80,60,30,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700 }}>登入门户</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 10, letterSpacing: 3, color: '#a9863c', marginTop: 4 }}>SIGN IN TO THE PORTAL</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', color: '#3f7a4c', fontSize: 14, lineHeight: 1.6 }} role="status">
            ✓ 登入连结已寄出。<br />Check your email for the sign-in link.
          </div>
        ) : (
          <form onSubmit={sendLink}>
            <label htmlFor="login-email" style={{ fontSize: 12, color: '#8a7f6c', fontWeight: 600 }}>电邮 · Email</label>
            <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', marginTop: 5, borderRadius: 10, border: '1.5px solid #cdbf9e', fontSize: 15 }} />
            <button type="submit" disabled={Boolean(busy) || !email}
              style={{ width: '100%', marginTop: 12, padding: '12px', borderRadius: 10, border: 'none', background: '#2a2622', color: '#f3e6bf', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: busy || !email ? 0.6 : 1 }}>
              {busy === 'email' ? '寄送中… Sending…' : '寄送登入连结 · Email me a link'}
            </button>

            <div style={{ textAlign: 'center', color: '#b6a988', fontSize: 12, margin: '14px 0' }}>或 · or</div>
            <button type="button" onClick={google} disabled={!googleEnabled || Boolean(busy)} aria-describedby="google-help"
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid #cdbf9e', background: '#fff', fontWeight: 600, fontSize: 14, cursor: googleEnabled ? 'pointer' : 'not-allowed', opacity: googleEnabled ? 1 : 0.55 }}>
              {busy === 'google' ? '连接中… Connecting…' : '使用 Google 登入 · Continue with Google'}
            </button>
            <div id="google-help" style={{ fontSize: 11, color: '#9a8d72', marginTop: 8, textAlign: 'center' }}>
              {googleEnabled
                ? 'Google OAuth 已启用 · Google OAuth enabled'
                : 'Google 登入尚未启用，请使用电邮。 · Google sign-in is not configured; please use email.'}
            </div>
          </form>
        )}
        {err && <div role="alert" style={{ color: '#b04a2e', fontSize: 12.5, marginTop: 12, textAlign: 'center', lineHeight: 1.55 }}>{err}</div>}
      </div>
    </main>
  );
}

'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '');

  async function sendLink() {
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=/portal` },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  }

  async function google() {
    setErr('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback?next=/portal` },
    });
    if (error) setErr(error.message);
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fffdf8', border: '1px solid #e6d9bd', borderRadius: 20, padding: 28, boxShadow: '0 8px 30px rgba(80,60,30,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700 }}>登入门户</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 10, letterSpacing: 3, color: '#a9863c', marginTop: 4 }}>SIGN IN TO THE PORTAL</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', color: '#3f7a4c', fontSize: 14, lineHeight: 1.6 }}>
            ✓ 登入连结已寄出。<br />Check your email for the sign-in link.
          </div>
        ) : (
          <>
            <label style={{ fontSize: 12, color: '#8a7f6c', fontWeight: 600 }}>电邮 · Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', marginTop: 5, borderRadius: 10, border: '1.5px solid #cdbf9e', fontSize: 15 }} />
            <button onClick={sendLink} disabled={busy || !email}
              style={{ width: '100%', marginTop: 12, padding: '12px', borderRadius: 10, border: 'none', background: '#2a2622', color: '#f3e6bf', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: busy || !email ? 0.6 : 1 }}>
              {busy ? '寄送中…' : '寄送登入连结 · Email me a link'}
            </button>

            <div style={{ textAlign: 'center', color: '#b6a988', fontSize: 12, margin: '14px 0' }}>或 · or</div>
            <button onClick={google}
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid #cdbf9e', background: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              使用 Google 登入 · Continue with Google
            </button>
            <div style={{ fontSize: 11, color: '#b6a988', marginTop: 8, textAlign: 'center' }}>
              Google 需在 Supabase 启用 OAuth。
            </div>
          </>
        )}
        {err && <div style={{ color: '#b04a2e', fontSize: 12.5, marginTop: 12, textAlign: 'center' }}>{err}</div>}
      </div>
    </main>
  );
}

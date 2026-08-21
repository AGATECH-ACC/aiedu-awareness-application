'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function TopNav({ user }) {
  const supabase = useMemo(() => createClient(), []);
  const [signingOut, setSigningOut] = useState(false);
  const initial = user?.email?.trim()?.charAt(0)?.toUpperCase() || 'P';

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.assign('/');
  }

  return (
    <nav className="top-nav" aria-label="主要导航 · Main navigation" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      maxWidth: 900, margin: '0 auto', padding: '14px 18px',
    }}>
      <Link href="/" style={{ textDecoration: 'none', fontWeight: 800, letterSpacing: 1, color: '#2a2622' }}>
        觉察卡 <span style={{ color: '#b5842b', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 400 }}>Awareness</span>
      </Link>
      <div className="top-nav-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5 }}>
        <Link className="top-nav-draw" href="/" style={{ color: '#7a6f5a', textDecoration: 'none' }}>抽牌 Draw</Link>
        {user ? (
          <>
            <Link href="/portal" aria-label={`我的门户 · Portal · ${user.email || ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2a2622', color: '#f3e6bf', padding: '6px 11px 6px 7px', borderRadius: 999, textDecoration: 'none', fontWeight: 700 }}>
              <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 23, height: 23, borderRadius: '50%', background: '#b5842b', color: '#fff', fontSize: 11 }}>{initial}</span>
              Portal
            </Link>
            <button type="button" onClick={signOut} disabled={signingOut} style={{ border: 0, background: 'transparent', color: '#8a6c31', padding: '6px 2px', cursor: signingOut ? 'wait' : 'pointer', fontWeight: 600, fontSize: 12 }}>
              {signingOut ? '登出中…' : '登出 · Sign out'}
            </button>
          </>
        ) : (
          <Link href="/login" style={{ background: '#b5842b', color: '#fff', padding: '7px 14px', borderRadius: 999, textDecoration: 'none', fontWeight: 700 }}>登入 Sign in</Link>
        )}
      </div>
    </nav>
  );
}

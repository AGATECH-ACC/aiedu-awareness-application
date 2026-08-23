'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Cards } from '@phosphor-icons/react/Cards';
import { SignIn } from '@phosphor-icons/react/SignIn';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function TopNav({ user, variant = 'default' }) {
  const supabase = useMemo(() => createClient(), []);
  const [signingOut, setSigningOut] = useState(false);
  const initial = user?.email?.trim()?.charAt(0)?.toUpperCase() || 'P';

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.assign('/');
  }

  return (
    <nav className={`top-nav${variant !== 'default' ? ` top-nav--${variant}` : ''}`} aria-label="主要导航 · Main navigation">
      <Link className="top-nav-brand" href="/">
        {variant === 'card' ? (
          <>
            <Image
              className="top-nav-brand-logo"
              src="/brand/aiedu-awareness-logo-alpha.png"
              alt="AiEDU · Ai 育赋能教育学院"
              width={136}
              height={62}
              priority
            />
            <span className="top-nav-brand-copy">
              <strong>幸福人生觉察卡</strong>
              <small>Awareness Cards</small>
            </span>
          </>
        ) : (
          <>
            <span>幸福人生觉察卡</span>
            <small>Awareness</small>
          </>
        )}
      </Link>
      <div className="top-nav-actions">
        <Link className="top-nav-draw" href="/draw">
          {variant === 'card' ? <Cards size={18} weight="regular" aria-hidden="true" /> : null}
          <span>抽牌 <small>Draw</small></span>
        </Link>
        {user ? (
          <>
            <Link className="top-nav-portal" href="/portal" aria-label={`我的门户 · Portal · ${user.email || ''}`}>
              <span aria-hidden="true">{initial}</span>
              Portal
            </Link>
            <button className="top-nav-signout" type="button" onClick={signOut} disabled={signingOut}>
              {signingOut ? '登出中…' : '登出 · Sign out'}
            </button>
          </>
        ) : (
          <Link className="top-nav-signin" href="/login">
            {variant === 'card' ? <SignIn size={18} weight="bold" aria-hidden="true" /> : null}
            <span>登入 <small>Sign in</small></span>
          </Link>
        )}
      </div>
    </nav>
  );
}

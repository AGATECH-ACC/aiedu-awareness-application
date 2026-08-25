'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Cards } from '@phosphor-icons/react/Cards';
import { SignIn } from '@phosphor-icons/react/SignIn';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function TopNav({ user, variant = 'default', chineseOnly = false }) {
  const supabase = useMemo(() => createClient(), []);
  const [signingOut, setSigningOut] = useState(false);
  const initial = user?.email?.trim()?.charAt(0)?.toUpperCase() || 'P';

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.assign('/');
  }

  return (
    <nav className={`top-nav${variant !== 'default' ? ` top-nav--${variant}` : ''}`} aria-label={chineseOnly ? '主要导航' : '主要导航 · Main navigation'}>
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
              {!chineseOnly ? <small>Awareness Cards</small> : null}
            </span>
          </>
        ) : (
          <>
            <span>幸福人生觉察卡</span>
            {!chineseOnly ? <small>Awareness</small> : null}
          </>
        )}
      </Link>
      <div className="top-nav-actions">
        <Link className="top-nav-draw" href="/draw">
          {variant === 'card' ? <Cards size={18} weight="regular" aria-hidden="true" /> : null}
          <span>抽牌 {!chineseOnly ? <small>Draw</small> : null}</span>
        </Link>
        {user ? (
          <>
            <Link className="top-nav-portal" href="/portal" aria-label={`${chineseOnly ? '我的门户' : '我的门户 · Portal'} · ${user.email || ''}`}>
              <span aria-hidden="true">{initial}</span>
              {chineseOnly ? '我的门户' : 'Portal'}
            </Link>
            <button className="top-nav-signout" type="button" onClick={signOut} disabled={signingOut}>
              {signingOut ? '登出中…' : chineseOnly ? '登出' : '登出 · Sign out'}
            </button>
          </>
        ) : (
          <Link className="top-nav-signin" href="/login">
            {variant === 'card' ? <SignIn size={18} weight="bold" aria-hidden="true" /> : null}
            <span>登入 {!chineseOnly ? <small>Sign in</small> : null}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

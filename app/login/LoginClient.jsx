'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { CheckCircle } from '@phosphor-icons/react/CheckCircle';
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

const EXPIRED_MESSAGE = '登入连结已过期或无效，请重新申请。 · This sign-in link has expired or is invalid. Please request a new one.';
const GOOGLE_MESSAGE = 'Google 登入暂时无法使用，请改用电邮登入。 · Google sign-in is unavailable. Please use the email link instead.';
const EMAIL_ERROR_MESSAGE = '电邮连结寄送失败，请稍后再试。 · We could not send the email link. Please try again.';
const ACCOUNT_UNAVAILABLE_MESSAGE = '找不到可使用电邮连结登入的账户。请检查电邮，或先创建账户。 · We could not find an account that can use an email sign-in link. Check the email or create an account.';

export default function LoginClient({ nextPath, initialError, initialMode = 'signin' }) {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sentMode, setSentMode] = useState('');
  const [err, setErr] = useState(initialError === 'expired' ? EXPIRED_MESSAGE : '');
  const [offerSignup, setOfferSignup] = useState(false);
  const [busy, setBusy] = useState('');
  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';
  const isSignup = mode === 'signup';

  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || '');
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;

  async function sendLink(event) {
    event.preventDefault();
    setErr('');
    setOfferSignup(false);
    setBusy('email');
    const accountMode = mode;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
        shouldCreateUser: accountMode === 'signup',
        data: accountMode === 'signup' && displayName.trim()
          ? { full_name: displayName.trim() }
          : undefined,
      },
    });
    setBusy('');
    if (error) {
      const accountCannotUseEmailLink = accountMode === 'signin' && error.code === 'otp_disabled';
      setErr(accountCannotUseEmailLink ? ACCOUNT_UNAVAILABLE_MESSAGE : EMAIL_ERROR_MESSAGE);
      setOfferSignup(accountCannotUseEmailLink);
    } else {
      setSentMode(accountMode);
    }
  }

  function chooseMode(nextMode) {
    if (busy) return;
    setMode(nextMode);
    setSentMode('');
    setErr('');
    setOfferSignup(false);
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
    <main className="auth-page">
      <div className="auth-frame">
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
          <Image
            className={`auth-corner auth-corner--${corner}`}
            src="/brand/card-corner-alpha.png"
            alt=""
            width={96}
            height={96}
            aria-hidden="true"
            key={corner}
          />
        ))}
        <section className="auth-content" aria-labelledby="auth-title">
          <header className="auth-brand">
            <Image
              className="auth-brand-logo"
              src="/brand/aiedu-awareness-logo-alpha.png"
              alt="AiEDU · Ai 育赋能教育学院"
              width={340}
              height={155}
              priority
            />
            <h1 id="auth-title">幸福人生觉察卡</h1>
            <p className="auth-brand-en" lang="en">HAPPY LIFE AWARENESS CARDS</p>
            <div className="auth-brand-divider" aria-hidden="true" />
            <p className="auth-brand-promise">觉察 · 选择 · 行动 · 创造幸福人生</p>
            <p className="auth-brand-promise-en" lang="en">Awareness · Choice · Action · Create a happier life</p>
          </header>

          <div className="auth-workspace">
            <div className="auth-tabs" role="tablist" aria-label="账户操作 · Account action">
              {[
                ['signin', '登入', 'Sign in'],
                ['signup', '创建账户', 'Create account'],
              ].map(([value, cn, en]) => {
                const active = mode === value;
                return (
                  <button
                    className="auth-tab"
                    data-active={active ? 'true' : 'false'}
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => chooseMode(value)}
                    disabled={Boolean(busy)}
                  >
                    <span>{cn}</span>
                    <small lang="en">{en}</small>
                  </button>
                );
              })}
            </div>

            {sentMode ? (
              <div className="auth-sent" role="status">
                <CheckCircle size={38} weight="duotone" aria-hidden="true" />
                <strong>{sentMode === 'signup' ? '账户确认连结已寄出。' : '登入连结已寄出。'}</strong>
                <span lang="en">{sentMode === 'signup' ? 'Check your email to confirm your account.' : 'Check your email for the sign-in link.'}</span>
                <button type="button" onClick={() => setSentMode('')}>
                  使用其他电邮 · Use another email
                </button>
              </div>
            ) : (
              <form className="auth-form" onSubmit={sendLink}>
                {isSignup ? (
                  <div className="auth-field">
                    <label htmlFor="signup-name">姓名 · Name <span>(optional)</span></label>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      maxLength={120}
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                ) : null}

                <div className="auth-field">
                  <label htmlFor="login-email">电邮 · Email</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <button className="auth-submit" type="submit" disabled={Boolean(busy) || !email}>
                  <EnvelopeSimple size={24} weight="regular" aria-hidden="true" />
                  <span>
                    {busy === 'email'
                      ? '寄送中… Sending…'
                      : isSignup
                        ? '创建账户 · Create account'
                        : '寄送登入连结 · Email me a sign-in link'}
                  </span>
                </button>

                {googleEnabled && !isSignup ? (
                  <div className="auth-google">
                    <span>或 · or</span>
                    <button type="button" onClick={google} disabled={Boolean(busy)}>
                      {busy === 'google' ? '连接中… Connecting…' : '使用 Google 登入 · Continue with Google'}
                    </button>
                  </div>
                ) : null}

                <p className="auth-help">
                  {isSignup
                    ? '我们会寄出安全确认连结，不需要设定密码。 · We will email you a secure confirmation link. No password is required.'
                    : '我们会寄出一次性安全登入连结。 · We will email you a secure, one-time sign-in link.'}
                </p>
              </form>
            )}

            {err ? (
              <div className="auth-alert" role="alert">
                <div>{err}</div>
                {offerSignup ? (
                  <Link href={signupHref}>创建账户 · Create account →</Link>
                ) : null}
              </div>
            ) : null}

            <Link className="auth-back" href="/">
              <ArrowLeft size={18} aria-hidden="true" />
              <span>返回觉察卡 · Back to the cards</span>
            </Link>
          </div>
        </section>

        <aside className="auth-visual" aria-label="幸福人生觉察卡 · Happy Life Awareness Cards">
          <Image
            className="auth-botanical"
            src="/brand/botanical-branch-transparent.png"
            alt=""
            width={934}
            height={1684}
            aria-hidden="true"
          />
          <Image
            className="auth-card-art"
            src="/cards/back-1.png"
            alt="幸福人生觉察卡牌背 · Happy Life Awareness Card back"
            width={556}
            height={934}
            priority
          />
        </aside>
      </div>
    </main>
  );
}

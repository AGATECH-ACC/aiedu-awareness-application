'use client';

import Link from 'next/link';
import { CheckCircle } from '@phosphor-icons/react/CheckCircle';
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple';
import { ShieldCheck } from '@phosphor-icons/react/ShieldCheck';
import { useState } from 'react';

export default function AccountInviteForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [invited, setInvited] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || '邀请暂时无法寄出。 · The invitation could not be sent.');
      setInvited(result);
    } catch (requestError) {
      setError(requestError.message || '邀请暂时无法寄出。 · The invitation could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  function inviteAnother() {
    setName('');
    setEmail('');
    setError('');
    setInvited(null);
  }

  if (invited) {
    return (
      <section className="account-invite-card account-invite-success" aria-live="polite">
        <CheckCircle size={48} weight="duotone" aria-hidden="true" />
        <span className="account-invite-eyebrow">EDUCATOR INVITATION SENT</span>
        <h1>教育者账户邀请已寄出</h1>
        <p lang="en">The educator account invitation has been sent.</p>
        <dl>
          <div><dt>姓名 · Name</dt><dd>{invited.name}</dd></div>
          <div><dt>电邮 · Email</dt><dd>{invited.email}</dd></div>
          <div><dt>角色 · Role</dt><dd>教育者 · Educator</dd></div>
        </dl>
        <p className="account-invite-guidance">
          对方会收到私人连结，可先建立自己的密码，再登入教育者工作台。<br />
          <span lang="en">They will receive a private link to create their password, then sign in to the educator workspace.</span>
        </p>
        <div className="account-invite-actions">
          <button type="button" onClick={inviteAnother}>邀请另一位 · Invite another</button>
          <Link href="/portal">返回门户 · Back to portal</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="account-invite-card" aria-labelledby="account-invite-title">
      <div className="account-invite-heading">
        <span className="account-invite-eyebrow">PRIVATE EDUCATOR INVITATION</span>
        <h1 id="account-invite-title">邀请教育者账户</h1>
        <p>
          这不是公开注册。只有已登入的教育者可以邀请另一位教育者。<br />
          <span lang="en">This is not public registration. Only a signed-in educator can invite another educator.</span>
        </p>
      </div>

      <form onSubmit={submit}>
        <label>
          <span>姓名 · Name</span>
          <input
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Recipient name"
          />
        </label>
        <label>
          <span>电邮 · Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
        </label>

        <div className="account-invite-security">
          <ShieldCheck size={23} weight="duotone" aria-hidden="true" />
          <p>
            此页面邀请的账户一律授予教育者角色，并须从私人电邮连结建立密码。普通用户角色仍保留，但不会由此页面建立。<br />
            <span lang="en">Every account invited here receives the educator role and must create a password from its private email link. The standard user role remains available but is not assigned by this page.</span>
          </p>
        </div>

        <button className="account-invite-submit" type="submit" disabled={busy || !name.trim() || !email.trim()}>
          <EnvelopeSimple size={23} aria-hidden="true" />
          <span>{busy ? '寄送中… · Sending…' : '寄出教育者邀请 · Send educator invitation'}</span>
        </button>
      </form>

      {error ? <div className="account-invite-error" role="alert">{error}</div> : null}
      <Link className="account-invite-back" href="/portal">← 返回教育者门户 · Back to educator portal</Link>
    </section>
  );
}

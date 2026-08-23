'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CardsThree,
  Check,
  FileText,
  House,
  List as MenuIcon,
  Plus,
  SignOut,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import CardDeck from '@/components/CardDeck';
import Markdownish from '@/components/Markdownish';
import { createClient } from '@/lib/supabase-browser';
import AdminReportRecords from './AdminReportRecords';
import PortalClient from './PortalClient';

const EMPTY_RECIPIENT = { name: '', email: '' };

function Step({ number, active, done, children }) {
  return (
    <div className={`educator-step${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}>
      <span>{done ? <Check size={14} weight="bold" aria-label="完成 · Complete" /> : number}</span>
      <div>{children}</div>
    </div>
  );
}

function ClientReadingFlow({ onDeliveryChange }) {
  const [recipient, setRecipient] = useState(EMPTY_RECIPIENT);
  const [confirmedRecipient, setConfirmedRecipient] = useState(null);
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [verified, setVerified] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [secondsToResend, setSecondsToResend] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [latest, setLatest] = useState(null);
  const [question, setQuestion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [resendingId, setResendingId] = useState(null);

  useEffect(() => {
    if (!resendAt) return undefined;
    const update = () => setSecondsToResend(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  useEffect(() => {
    if (!generating) {
      setElapsed(0);
      return undefined;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [generating]);

  async function requestCode(event) {
    event?.preventDefault();
    setRequesting(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/recipient-verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipient),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '验证码寄送失败。 · Could not send the verification code.');
      setVerificationId(data.verificationId);
      setMaskedEmail(data.maskedEmail);
      setConfirmedRecipient({ ...recipient, email: recipient.email.trim().toLowerCase() });
      setVerificationCode('');
      setVerified(false);
      setResendAt(Date.now() + Number(data.resendAfter || 60) * 1000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRequesting(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setVerifying(true);
    setError('');
    try {
      const response = await fetch('/api/recipient-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, code: verificationCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '验证码不正确。 · The code could not be verified.');
      setVerified(true);
      setConfirmedRecipient(data.recipient || confirmedRecipient);
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setVerifying(false);
    }
  }

  async function generateReport(retryReadingId = null) {
    if (!verified || (!latest && !retryReadingId)) return;
    setGenerating(true);
    setError('');
    try {
      const payload = retryReadingId
        ? { readingId: retryReadingId, recipientVerificationId: verificationId }
        : { ...latest, question, recipientVerificationId: verificationId };
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const generationError = new Error(data.message || '报告生成失败。 · Could not generate the report.');
        generationError.readingId = data.readingId || retryReadingId || null;
        throw generationError;
      }
      setResult(data);
      const freshDelivery = data.deliveryId ? {
        id: data.deliveryId,
        report_id: data.reportId,
        recipient_name: data.recipient?.name || confirmedRecipient?.name,
        recipient_email: data.recipient?.email || confirmedRecipient?.email,
        status: data.deliveryStatus || (data.emailSent ? 'sent' : 'failed'),
        emailed_at: data.emailSent ? new Date().toISOString() : null,
        created_at: data.createdAt || new Date().toISOString(),
        report: {
          id: data.reportId,
          content: data.content,
          created_at: data.createdAt,
          reading_id: data.readingId,
          readings: data.reading,
        },
      } : null;
      if (freshDelivery) {
        onDeliveryChange?.(freshDelivery);
      }
    } catch (generationError) {
      setError(generationError.message);
      if (generationError.readingId) setResult({ retryReadingId: generationError.readingId, failed: true });
    } finally {
      setGenerating(false);
    }
  }

  async function resendDelivery(deliveryId) {
    setResendingId(deliveryId);
    setError('');
    try {
      const response = await fetch(`/api/report-delivery/${deliveryId}`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '重新寄送失败。 · Resend failed.');
      onDeliveryChange?.({ id: deliveryId, status: 'sent', emailed_at: data.emailedAt });
      if (result?.deliveryId === deliveryId) setResult((current) => ({ ...current, emailSent: true, deliveryStatus: 'sent' }));
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setResendingId(null);
    }
  }

  function startAnother() {
    setRecipient(EMPTY_RECIPIENT);
    setConfirmedRecipient(null);
    setVerificationId('');
    setVerificationCode('');
    setMaskedEmail('');
    setVerified(false);
    setResendAt(0);
    setLatest(null);
    setQuestion('');
    setResult(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const stage = result?.content ? 4 : verified ? 3 : verificationId ? 2 : 1;

  return (
    <div className="educator-client-flow">
      <div className="educator-steps" aria-label="客户报告步骤 · Client report steps">
        <Step number="1" active={stage === 1} done={stage > 1}>收件资料<br /><small>Recipient</small></Step>
        <Step number="2" active={stage === 2} done={stage > 2}>邮箱验证<br /><small>Email OTP</small></Step>
        <Step number="3" active={stage === 3} done={stage > 3}>抽牌报告<br /><small>Draw & report</small></Step>
        <Step number="4" active={stage === 4} done={false}>邮件送达<br /><small>Delivery</small></Step>
      </div>

      {!verificationId ? (
        <form className="educator-panel recipient-form" onSubmit={requestCode}>
          <div className="educator-panel-heading">
            <span>01 · RECIPIENT CONSENT</span>
            <h2>先确认收件人 · Confirm the recipient</h2>
            <p>验证码会寄到对方邮箱。对方提供代码后，才可继续抽牌和寄送报告。<br />The recipient must provide the emailed code before you can draw and send their report.</p>
          </div>
          <div className="educator-form-grid">
            <label>
              <span>姓名 · Name</span>
              <input value={recipient.name} onChange={(event) => setRecipient((current) => ({ ...current, name: event.target.value }))} maxLength={120} autoComplete="name" required placeholder="收件人的姓名 · Recipient name" />
            </label>
            <label>
              <span>邮箱 · Email</span>
              <input type="email" value={recipient.email} onChange={(event) => setRecipient((current) => ({ ...current, email: event.target.value }))} maxLength={320} autoComplete="email" required placeholder="name@example.com" />
            </label>
          </div>
          <button type="submit" className="educator-primary-button" disabled={requesting}>
            {requesting ? '寄送中… · Sending…' : '寄送六位验证码 · Send 6-digit code'}
          </button>
        </form>
      ) : !verified ? (
        <form className="educator-panel otp-form" onSubmit={verifyCode}>
          <div className="educator-panel-heading">
            <span>02 · EMAIL VERIFICATION</span>
            <h2>输入收件人收到的代码 · Enter their code</h2>
            <p>已寄到 {maskedEmail}。代码十分钟内有效，最多尝试五次。<br />Sent to {maskedEmail}. The code is valid for ten minutes with five attempts.</p>
          </div>
          <label className="otp-input-label">
            <span className="sr-only">六位验证码 · Six-digit code</span>
            <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" autoFocus required />
          </label>
          <button type="submit" className="educator-primary-button" disabled={verifying || verificationCode.length !== 6}>
            {verifying ? '验证中… · Verifying…' : '确认代码并继续 · Verify and continue'}
          </button>
          <button type="button" className="educator-text-button" onClick={requestCode} disabled={requesting || secondsToResend > 0}>
            {secondsToResend > 0 ? `${secondsToResend} 秒后可重寄 · Resend in ${secondsToResend}s` : '重新寄送验证码 · Resend code'}
          </button>
          <button type="button" className="educator-text-button" onClick={() => { setVerificationId(''); setVerificationCode(''); setError(''); }}>
            修改收件资料 · Edit recipient
          </button>
        </form>
      ) : !result?.content ? (
        <div>
          <div className="recipient-verified" role="status">
            <span><Check size={16} weight="bold" aria-hidden="true" /></span>
            <div><strong>{confirmedRecipient?.name}</strong><small>{confirmedRecipient?.email} · 已验证 · Verified</small></div>
          </div>
          <CardDeck onReading={(reading) => { setLatest(reading); setResult(null); setError(''); }} />
          <section className="educator-panel educator-generate-panel">
            <div className="educator-panel-heading">
              <span>03 · PERSONAL REPORT</span>
              <h2>建立并寄送报告 · Create and send report</h2>
              <p>{latest ? '本次抽牌已准备好。 · This reading is ready.' : '请先在上方完成抽牌。 · Complete the draw above first.'}</p>
            </div>
            <label>
              <span>觉察情境（可选）· Reflection context (optional)</span>
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} placeholder="对方此刻想觉察的问题或情境… · A question or situation they want to reflect on…" />
            </label>
            <button type="button" className="educator-primary-button" onClick={() => generateReport()} disabled={!latest || generating}>
              {generating ? '报告生成中… · Generating…' : '生成报告并寄到收件邮箱 · Generate and email report'}
            </button>
            {generating ? <div className="educator-elapsed" role="status">已等待 {elapsed} 秒 · {elapsed}s elapsed</div> : null}
            {result?.failed && result.retryReadingId ? (
              <button type="button" className="educator-secondary-button" onClick={() => generateReport(result.retryReadingId)} disabled={generating}>用同一次抽牌重试 · Retry this reading</button>
            ) : null}
          </section>
        </div>
      ) : (
        <section className="educator-panel educator-complete">
          <div className={`delivery-result${result.emailSent ? ' is-sent' : ' is-failed'}`}>
            <span>{result.emailSent ? <Check size={18} weight="bold" aria-hidden="true" /> : <WarningCircle size={18} weight="bold" aria-hidden="true" />}</span>
            <div>
              <h2>{result.emailSent ? '报告已寄出 · Report sent' : '报告已建立，邮件尚未寄出 · Report saved; email pending'}</h2>
              <p>{confirmedRecipient?.name} · {confirmedRecipient?.email}</p>
            </div>
          </div>
          {!result.emailSent && result.deliveryId ? (
            <button type="button" className="educator-secondary-button" onClick={() => resendDelivery(result.deliveryId)} disabled={resendingId === result.deliveryId}>
              {resendingId === result.deliveryId ? '重新寄送中… · Resending…' : '重新寄送报告 · Resend report'}
            </button>
          ) : null}
          <Markdownish text={result.content} />
          <button type="button" className="educator-primary-button" onClick={startAnother}>为另一位收件人抽牌 · Start another reading</button>
        </section>
      )}

      {error ? <div className="educator-error" role="alert">{error}</div> : null}

    </div>
  );
}

export default function EducatorPortal({ userId, email, ownReports, deliveries, requirePlan, plan }) {
  const [view, setView] = useState('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deliveryRecords, setDeliveryRecords] = useState(Array.isArray(deliveries) ? deliveries : []);

  useEffect(() => {
    function syncFromHash() {
      if (window.location.hash === '#my-reports') setView('mine');
      else if (window.location.hash === '#new-client-reading') setView('clients');
      else setView('overview');
    }

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [drawerOpen]);

  function navigate(nextView) {
    setView(nextView);
    setDrawerOpen(false);
    const hash = nextView === 'mine' ? '#my-reports' : nextView === 'clients' ? '#new-client-reading' : '#client-reports';
    window.history.replaceState(null, '', hash);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateDelivery(nextDelivery) {
    if (!nextDelivery?.id) return;
    setDeliveryRecords((current) => {
      const existing = current.find((item) => item.id === nextDelivery.id);
      if (!existing) return [nextDelivery, ...current];
      return current.map((item) => item.id === nextDelivery.id ? { ...item, ...nextDelivery } : item);
    });
  }

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign('/');
  }

  const pageCopy = {
    overview: {
      eyebrow: 'REPORT LIBRARY · 报告资料库',
      title: '客户报告 · Client reports',
      description: '查看并管理你为客户建立的觉察报告。 · View and manage the awareness reports you have created for clients.',
    },
    clients: {
      eyebrow: 'VERIFIED READING · 验证式抽牌',
      title: '建立客户报告 · New client reading',
      description: '先取得收件人邮箱验证码，再完成抽牌与报告寄送。 · Verify the recipient by email before drawing and sending their report.',
    },
    mine: {
      eyebrow: 'PERSONAL AWARENESS · 个人觉察',
      title: '我的报告 · My reports',
      description: '为自己抽牌、保存觉察记录，并打开完整报告。 · Draw for yourself, save your readings, and revisit full reports.',
    },
  }[view];

  const navigation = [
    { id: 'overview', label: '总览', labelEn: 'Overview', Icon: House },
    { id: 'clients', label: '为他人抽牌', labelEn: 'Client reading', Icon: CardsThree },
    { id: 'mine', label: '我的报告', labelEn: 'My reports', Icon: FileText },
  ];

  const sidebar = (
    <aside className={`admin-sidebar${drawerOpen ? ' is-open' : ''}`} aria-label="教育者门户导航 · Educator portal navigation">
      <div className="admin-sidebar-top">
        <Link className="admin-brand" href="/" onClick={() => setDrawerOpen(false)}>
          <strong>幸福人生觉察卡</strong>
          <span>AWARENESS CARDS</span>
        </Link>
        <button className="admin-drawer-close" type="button" aria-label="关闭菜单 · Close menu" onClick={() => setDrawerOpen(false)}>
          <X size={23} aria-hidden="true" />
        </button>
      </div>

      <div className="admin-sidebar-caption">
        <span>教育者工作台</span>
        <small>EDUCATOR WORKSPACE</small>
      </div>

      <nav className="admin-nav">
        {navigation.map(({ id, label, labelEn, Icon }) => (
          <button key={id} type="button" className={view === id ? 'is-active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => navigate(id)}>
            <Icon size={22} weight={view === id ? 'fill' : 'regular'} aria-hidden="true" />
            <span><strong>{label}</strong><small>{labelEn}</small></span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-account">
        <div className="admin-account-avatar" aria-hidden="true">E</div>
        <div className="admin-account-copy">
          <strong>教育者 · Educator</strong>
          <span>{email}</span>
        </div>
        <button type="button" onClick={signOut} disabled={signingOut}>
          <SignOut size={19} aria-hidden="true" />
          <span>{signingOut ? '登出中… · Signing out…' : '登出 · Sign out'}</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="educator-admin">
      {sidebar}
      {drawerOpen ? <button type="button" className="admin-drawer-backdrop" aria-label="关闭菜单 · Close menu" onClick={() => setDrawerOpen(false)} /> : null}

      <div className="admin-mobile-bar">
        <button type="button" aria-label="打开菜单 · Open menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
          <MenuIcon size={24} aria-hidden="true" />
        </button>
        <Link href="/">幸福人生觉察卡 <span>Awareness</span></Link>
        <div className="admin-mobile-avatar" aria-hidden="true">E</div>
      </div>

      <main className="admin-main">
        <header className="admin-page-header">
          <div>
            <span>{pageCopy.eyebrow}</span>
            <h1>{pageCopy.title}</h1>
            <p>{pageCopy.description}</p>
          </div>
          {view !== 'clients' ? (
            <button type="button" className="admin-new-reading" onClick={() => navigate('clients')}>
              <Plus size={20} weight="bold" aria-hidden="true" />
              <span>新增客户阅读<small>New client reading</small></span>
            </button>
          ) : (
            <button type="button" className="admin-back-to-reports" onClick={() => navigate('overview')}>
              <FileText size={19} aria-hidden="true" />
              <span>返回客户报告 · Back to reports</span>
            </button>
          )}
        </header>

        <div className="admin-page-content">
          {view === 'overview' ? (
            <AdminReportRecords deliveries={deliveryRecords} />
          ) : view === 'clients' ? (
            <ClientReadingFlow onDeliveryChange={updateDelivery} />
          ) : (
            <PortalClient userId={userId} email={email} initialReports={ownReports} requirePlan={requirePlan} plan={plan} showAccountHeader={false} embeddedAdmin />
          )}
        </div>
      </main>
    </div>
  );
}

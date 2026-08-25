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
      <span>{done ? <Check size={14} weight="bold" aria-label="完成" /> : number}</span>
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
      if (!response.ok) throw new Error(data.message || '验证码寄送失败。');
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
      if (!response.ok) throw new Error(data.message || '验证码不正确。');
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
        const generationError = new Error(data.message || '报告生成失败。');
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
      if (!response.ok) throw new Error(data.message || '重新寄送失败。');
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
      <div className="educator-steps" aria-label="客户报告步骤">
        <Step number="1" active={stage === 1} done={stage > 1}>收件资料</Step>
        <Step number="2" active={stage === 2} done={stage > 2}>邮箱验证</Step>
        <Step number="3" active={stage === 3} done={stage > 3}>抽牌报告</Step>
        <Step number="4" active={stage === 4} done={false}>邮件送达</Step>
      </div>

      {!verificationId ? (
        <form className="educator-panel recipient-form" onSubmit={requestCode}>
          <div className="educator-panel-heading">
            <span>01 · 收件确认</span>
            <h2>先确认收件人</h2>
            <p>验证码会寄到对方邮箱。对方提供代码后，才可继续抽牌和寄送报告。</p>
          </div>
          <div className="educator-form-grid">
            <label>
              <span>姓名</span>
              <input value={recipient.name} onChange={(event) => setRecipient((current) => ({ ...current, name: event.target.value }))} maxLength={120} autoComplete="name" required placeholder="收件人的姓名" />
            </label>
            <label>
              <span>邮箱</span>
              <input type="email" value={recipient.email} onChange={(event) => setRecipient((current) => ({ ...current, email: event.target.value }))} maxLength={320} autoComplete="email" required placeholder="请输入邮箱地址" />
            </label>
          </div>
          <button type="submit" className="educator-primary-button" disabled={requesting}>
            {requesting ? '寄送中…' : '寄送六位验证码'}
          </button>
        </form>
      ) : !verified ? (
        <form className="educator-panel otp-form" onSubmit={verifyCode}>
          <div className="educator-panel-heading">
            <span>02 · 邮箱验证</span>
            <h2>输入收件人收到的代码</h2>
            <p>已寄到 {maskedEmail}。代码十分钟内有效，最多尝试五次。</p>
          </div>
          <label className="otp-input-label">
            <span className="sr-only">六位验证码</span>
            <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" autoFocus required />
          </label>
          <button type="submit" className="educator-primary-button" disabled={verifying || verificationCode.length !== 6}>
            {verifying ? '验证中…' : '确认代码并继续'}
          </button>
          <button type="button" className="educator-text-button" onClick={requestCode} disabled={requesting || secondsToResend > 0}>
            {secondsToResend > 0 ? `${secondsToResend} 秒后可重寄` : '重新寄送验证码'}
          </button>
          <button type="button" className="educator-text-button" onClick={() => { setVerificationId(''); setVerificationCode(''); setError(''); }}>
            修改收件资料
          </button>
        </form>
      ) : !result?.content ? (
        <div>
          <div className="recipient-verified" role="status">
            <span><Check size={16} weight="bold" aria-hidden="true" /></span>
            <div><strong>{confirmedRecipient?.name}</strong><small>{confirmedRecipient?.email} · 已验证</small></div>
          </div>
          <CardDeck onReading={(reading) => { setLatest(reading); setResult(null); setError(''); }} />
          <section className="educator-panel educator-generate-panel">
            <div className="educator-panel-heading">
              <span>03 · 建立报告</span>
              <h2>建立并寄送报告</h2>
              <p>{latest ? '本次抽牌已准备好。' : '请先在上方完成抽牌。'}</p>
            </div>
            <label>
              <span>觉察情境（可选）</span>
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} placeholder="对方此刻想觉察的问题或情境…" />
            </label>
            <button type="button" className="educator-primary-button" onClick={() => generateReport()} disabled={!latest || generating}>
              {generating ? '报告生成中…' : '生成报告并寄到收件邮箱'}
            </button>
            {generating ? <div className="educator-elapsed" role="status">已等待 {elapsed} 秒</div> : null}
            {result?.failed && result.retryReadingId ? (
              <button type="button" className="educator-secondary-button" onClick={() => generateReport(result.retryReadingId)} disabled={generating}>用同一次抽牌重试</button>
            ) : null}
          </section>
        </div>
      ) : (
        <section className="educator-panel educator-complete">
          <div className={`delivery-result${result.emailSent ? ' is-sent' : ' is-failed'}`}>
            <span>{result.emailSent ? <Check size={18} weight="bold" aria-hidden="true" /> : <WarningCircle size={18} weight="bold" aria-hidden="true" />}</span>
            <div>
              <h2>{result.emailSent ? '报告已寄出' : '报告已建立，邮件尚未寄出'}</h2>
              <p>{confirmedRecipient?.name} · {confirmedRecipient?.email}</p>
            </div>
          </div>
          {!result.emailSent && result.deliveryId ? (
            <button type="button" className="educator-secondary-button" onClick={() => resendDelivery(result.deliveryId)} disabled={resendingId === result.deliveryId}>
              {resendingId === result.deliveryId ? '重新寄送中…' : '重新寄送报告'}
            </button>
          ) : null}
          <Markdownish text={result.content} />
          <button type="button" className="educator-primary-button" onClick={startAnother}>为另一位收件人抽牌</button>
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
      eyebrow: '报告资料库',
      title: '客户报告',
      description: '查看并管理你为客户建立的觉察报告。',
    },
    clients: {
      eyebrow: '验证式抽牌',
      title: '建立客户报告',
      description: '先取得收件人邮箱验证码，再完成抽牌与报告寄送。',
    },
    mine: {
      eyebrow: '个人觉察',
      title: '我的报告',
      description: '为自己抽牌、保存觉察记录，并打开完整报告。',
    },
  }[view];

  const navigation = [
    { id: 'overview', label: '总览', Icon: House },
    { id: 'clients', label: '为他人抽牌', Icon: CardsThree },
    { id: 'mine', label: '我的报告', Icon: FileText },
  ];

  const sidebar = (
    <aside className={`admin-sidebar${drawerOpen ? ' is-open' : ''}`} aria-label="教育者门户导航">
      <div className="admin-sidebar-top">
        <Link className="admin-brand" href="/" onClick={() => setDrawerOpen(false)}>
          <strong>幸福人生觉察卡</strong>
        </Link>
        <button className="admin-drawer-close" type="button" aria-label="关闭菜单" onClick={() => setDrawerOpen(false)}>
          <X size={23} aria-hidden="true" />
        </button>
      </div>

      <div className="admin-sidebar-caption">
        <span>教育者工作台</span>
      </div>

      <nav className="admin-nav">
        {navigation.map(({ id, label, Icon }) => (
          <button key={id} type="button" className={view === id ? 'is-active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => navigate(id)}>
            <Icon size={22} weight={view === id ? 'fill' : 'regular'} aria-hidden="true" />
            <span><strong>{label}</strong></span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-account">
        <div className="admin-account-avatar" aria-hidden="true">E</div>
        <div className="admin-account-copy">
          <strong>教育者</strong>
          <span>{email}</span>
        </div>
        <button type="button" onClick={signOut} disabled={signingOut}>
          <SignOut size={19} aria-hidden="true" />
          <span>{signingOut ? '登出中…' : '登出'}</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="educator-admin">
      {sidebar}
      {drawerOpen ? <button type="button" className="admin-drawer-backdrop" aria-label="关闭菜单" onClick={() => setDrawerOpen(false)} /> : null}

      <div className="admin-mobile-bar">
        <button type="button" aria-label="打开菜单" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
          <MenuIcon size={24} aria-hidden="true" />
        </button>
        <Link href="/">幸福人生觉察卡</Link>
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
              <span>新增客户报告</span>
            </button>
          ) : (
            <button type="button" className="admin-back-to-reports" onClick={() => navigate('overview')}>
              <FileText size={19} aria-hidden="true" />
              <span>返回客户报告</span>
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

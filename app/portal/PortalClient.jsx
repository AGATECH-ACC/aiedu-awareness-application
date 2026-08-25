'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CircleNotch, FileText, Trash } from '@phosphor-icons/react';
import CardDeck from '@/components/CardDeck';
import Markdownish from '@/components/Markdownish';
import { byNum, readingSpreadLabel } from '@/lib/cards';
import { deleteReport, shareReport } from '@/lib/db';
import { createClient } from '@/lib/supabase-browser';

const ERROR_COPY = {
  401: '登入状态已过期，请重新登入。',
  429: '今日深度报告已达上限，请明天再来。',
};

function reportDate(value) {
  return new Date(value).toLocaleString('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Kuala_Lumpur',
  });
}

function CardsSummary({ reading }) {
  const cards = Array.isArray(reading?.cards) ? reading.cards : [];
  if (!cards.length) return null;

  return (
    <div style={{ marginTop: 6 }} aria-label="抽到的牌">
      <div style={{ color: '#806a3e', fontSize: 12, fontWeight: 800 }}>{readingSpreadLabel(reading?.mode, reading?.spread_key)}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
        {cards.map((item, index) => {
          const card = byNum[item?.n];
          return (
            <span key={`${item?.n}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f5ecd9', color: '#6d5d3c', borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>
              {card ? `${String(card.n).padStart(2, '0')} ${card.cn}` : `#${item?.n}`}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function PortalClient({ userId, email, initialReports, requirePlan = false, plan = 'free', showAccountHeader = true, embeddedAdmin = false }) {
  const supabase = useMemo(() => createClient(), []);
  const [latest, setLatest] = useState(null);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [errorState, setErrorState] = useState(null);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState(Array.isArray(initialReports) ? initialReports : []);
  const [deletingId, setDeletingId] = useState(null);
  const [sharingId, setSharingId] = useState(null);
  const [shareState, setShareState] = useState(null);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const planRequired = requirePlan && plan === 'free';

  useEffect(() => {
    if (!busy) {
      setElapsed(0);
      return undefined;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  async function generate(retryReadingId = null) {
    if (!retryReadingId && !latest) return;
    setBusy(true);
    setErrorState(null);
    setReport(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retryReadingId ? { readingId: retryReadingId } : { ...latest, question }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorState({
          status: response.status,
          message: data.message || ERROR_COPY[response.status] || '操作失败，请稍后再试。',
          readingId: data.readingId || retryReadingId || null,
        });
        return;
      }

      const fresh = {
        id: data.reportId,
        content: data.content,
        created_at: data.createdAt || new Date().toISOString(),
        reading_id: data.readingId,
        readings: data.reading || null,
        is_public: false,
        share_token: null,
      };
      setReport(data.content);
      setReports((current) => [fresh, ...current.filter((item) => item.id !== fresh.id)]);
    } catch {
      setErrorState({
        status: 0,
        message: '网络连接中断，请检查网络后重试。',
        readingId: retryReadingId,
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeReport(id) {
    const confirmed = window.confirm('确定删除这份报告吗？此操作无法撤销。');
    if (!confirmed) return;

    setDeletingId(id);
    setErrorState(null);
    try {
      const deleted = await deleteReport(supabase, id, userId);
      if (!deleted) throw new Error('not_deleted');
      setReports((current) => current.filter((item) => item.id !== id));
    } catch {
      setErrorState({ status: 0, message: '无法删除报告，请稍后再试。' });
    } finally {
      setDeletingId(null);
    }
  }

  async function makeShareable(item) {
    setSharingId(item.id);
    setErrorState(null);
    try {
      const token = item.is_public && item.share_token ? item.share_token : window.crypto.randomUUID();
      let shared = { id: item.id, is_public: true, share_token: token };
      if (!item.is_public || !item.share_token) {
        shared = await shareReport(supabase, { id: item.id, userId, token });
        if (!shared) throw new Error('not_shared');
        setReports((current) => current.map((reportItem) => (
          reportItem.id === item.id ? { ...reportItem, ...shared } : reportItem
        )));
      }
      setShareState({
        reportId: item.id,
        url: `${window.location.origin}/r/${shared.share_token}`,
        copied: false,
      });
    } catch {
      setErrorState({ status: 0, message: '无法建立分享连结，请稍后再试。' });
    } finally {
      setSharingId(null);
    }
  }

  async function copyShareLink() {
    if (!shareState?.url) return;
    try {
      await navigator.clipboard.writeText(shareState.url);
      setShareState((current) => ({ ...current, copied: true }));
    } catch {
      setShareState((current) => ({ ...current, copied: false, copyFailed: true }));
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign('/');
  }

  // TODO(payments): connect this stub to the approved Curlec/Stripe checkout flow.
  function startCheckout() {
    setUpgradeMessage('付款功能尚未连接，请联系团队升级。');
  }

  return (
    <div className={embeddedAdmin ? 'portal-client portal-client--admin' : 'portal-client'} style={{ maxWidth: embeddedAdmin ? 920 : 460, margin: '0 auto', padding: '0 0 40px' }}>
      <style>{`
        @keyframes portal-spin { to { transform: rotate(360deg); } }
        .portal-spinner { animation: portal-spin .8s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .portal-spinner { animation: none !important; } }
      `}</style>
      {showAccountHeader ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '4px 16px 0', fontSize: 14, color: '#7a6f5a' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>已登入 · {email}</span>
          <button type="button" onClick={signOut} style={{ flex: '0 0 auto', border: 'none', background: 'transparent', color: '#b5842b', fontWeight: 600, cursor: 'pointer' }}>登出</button>
        </div>
      ) : null}

      <CardDeck onReading={setLatest} />

      <div style={{ padding: '0 16px' }}>
        <section aria-labelledby="deep-report-title" style={{ background: '#fffdf8', border: '1px solid #e6d9bd', borderRadius: 18, padding: 18, marginTop: 4 }}>
          <div id="deep-report-title" style={{ fontWeight: 800, color: '#2a2622' }}>深度报告</div>
          <div style={{ fontSize: 14, color: '#7a6f5a', margin: '4px 0 10px' }}>
            {latest ? '已捕捉本次抽牌，可生成报告。' : '先在上方抽一次牌。'}
          </div>
          <label htmlFor="reflection-question" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>反思问题</label>
          <textarea id="reflection-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000}
            placeholder="（可选）此刻你想觉察的问题或情境…"
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 64, padding: 10, borderRadius: 10, border: '1.5px solid #cdbf9e', fontSize: 16, resize: 'vertical' }} />
          {planRequired ? (
            <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: '#f5ecd6', border: '1px solid #dfc78f', textAlign: 'center' }}>
              <div style={{ color: '#654f26', fontWeight: 800, fontSize: 15 }}>升级后生成深度报告</div>
              <div style={{ color: '#7c6c4f', fontSize: 14, lineHeight: 1.65, marginTop: 3 }}>你的抽牌仍可免费使用，升级方案后可生成并保存深度报告。</div>
              <button type="button" onClick={startCheckout} style={{ marginTop: 9, border: 0, borderRadius: 999, padding: '8px 14px', background: '#8b6929', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>了解升级</button>
              {upgradeMessage && <div role="status" style={{ marginTop: 7, color: '#775f31', fontSize: 12 }}>{upgradeMessage}</div>}
            </div>
          ) : (
            <button type="button" onClick={() => generate()} disabled={!latest || busy}
              style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 10, border: 'none', background: '#2a2622', color: '#f3e6bf', fontWeight: 700, fontSize: 16, cursor: !latest || busy ? 'default' : 'pointer', opacity: !latest || busy ? 0.55 : 1 }}>
              {busy ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <CircleNotch className="portal-spinner" size={15} weight="bold" aria-hidden="true" />
                  生成中…
                </span>
              ) : '生成深度报告'}
            </button>
          )}
          {busy && <div role="status" aria-live="polite" style={{ textAlign: 'center', color: '#8a7f6c', fontSize: 13, marginTop: 7 }}>已等待 {elapsed} 秒</div>}

          {errorState && (
            <div role="alert" style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid #e5b6a7', background: '#fff2ed', color: '#913f2c', fontSize: 14, lineHeight: 1.65 }}>
              <div>{errorState.message}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {errorState.status === 401 && <Link href="/login?next=/portal" style={{ color: '#913f2c', fontWeight: 800 }}>重新登入</Link>}
                {errorState.readingId && (
                  <button type="button" onClick={() => generate(errorState.readingId)} disabled={busy} style={{ border: 0, borderRadius: 999, padding: '7px 12px', background: '#913f2c', color: '#fff', cursor: busy ? 'wait' : 'pointer', fontWeight: 700 }}>
                    用同一次抽牌重试
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {report && (
          <section aria-label="最新深度报告" style={{ background: '#fffdf8', border: '1px solid #e6d9bd', borderRadius: 18, padding: '6px 18px 18px', marginTop: 14 }}>
            <Markdownish text={report} />
          </section>
        )}

        <section aria-labelledby="history-title" style={{ marginTop: 22 }}>
          <div id="history-title" style={{ fontWeight: 800, color: '#2a2622', marginBottom: 8 }}>历史报告</div>
          {reports.length === 0 ? (
            <div style={{ background: 'rgba(255,253,248,.72)', border: '1px dashed #d8c8a6', borderRadius: 14, padding: '22px 18px', textAlign: 'center', color: '#7a6f5a' }}>
              <FileText size={25} weight="duotone" aria-hidden="true" style={{ marginBottom: 5 }} />
              <div style={{ fontWeight: 700, color: '#4f4638' }}>还没有历史报告</div>
              <div style={{ fontSize: 14, lineHeight: 1.65, marginTop: 4 }}>完成一次抽牌并生成报告后，会保存在这里。</div>
            </div>
          ) : reports.map((item) => (
            <article key={item.id} style={{ background: '#fffdf8', border: '1px solid #eadfc4', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <Link href={`/portal/reports/${item.id}`}
                  aria-label={`查看报告 ${reportDate(item.created_at)}`}
                  style={{ minWidth: 0, flex: 1, color: 'inherit', textAlign: 'left', background: 'transparent', padding: '11px 14px', textDecoration: 'none', fontSize: 14 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: '#3a352e' }}>{reportDate(item.created_at)}</span>
                    <span style={{ flex: '0 0 auto', color: '#b5842b', fontWeight: 750 }}>查看报告 →</span>
                  </span>
                  <CardsSummary reading={item.readings} />
                </Link>
                <button type="button" aria-label="删除报告" onClick={() => removeReport(item.id)} disabled={deletingId === item.id}
                  style={{ flex: '0 0 auto', width: 52, border: 0, borderLeft: '1px solid #efe5d0', background: '#fffaf0', color: '#a34b38', cursor: deletingId === item.id ? 'wait' : 'pointer', fontSize: 16 }}>
                  {deletingId === item.id ? <CircleNotch className="portal-spinner" size={16} aria-label="删除中" /> : <Trash size={17} aria-hidden="true" />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f2ead8', padding: '6px 10px', background: '#fffcf5' }}>
                <button type="button" onClick={() => makeShareable(item)} disabled={sharingId === item.id}
                  style={{ border: 0, background: 'transparent', color: '#8a6727', cursor: sharingId === item.id ? 'wait' : 'pointer', fontSize: 14, fontWeight: 750 }}>
                  {sharingId === item.id ? '建立中…' : item.is_public ? '分享连结' : '分享'}
                </button>
              </div>
              {shareState?.reportId === item.id && (
                <div style={{ borderTop: '1px solid #efe5d0', background: '#f8f1e2', padding: '9px 10px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input aria-label="公开分享连结" readOnly value={shareState.url} onFocus={(event) => event.currentTarget.select()}
                      style={{ minWidth: 0, flex: 1, border: '1px solid #d7c59f', borderRadius: 8, background: '#fffdf8', color: '#5d513d', padding: '7px 8px', fontSize: 13 }} />
                    <button type="button" onClick={copyShareLink} style={{ flex: '0 0 auto', border: 0, borderRadius: 8, background: '#7d642f', color: '#fff', padding: '7px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                      {shareState.copied ? '已复制' : '复制'}
                    </button>
                  </div>
                  {shareState.copyFailed && <div style={{ color: '#8b4a37', fontSize: 12, marginTop: 4 }}>请手动复制上方连结。</div>}
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

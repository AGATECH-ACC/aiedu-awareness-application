'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CardDeck from '@/components/CardDeck';
import Markdownish from '@/components/Markdownish';
import { byNum } from '@/lib/cards';
import { deleteReport } from '@/lib/db';
import { createClient } from '@/lib/supabase-browser';

const ERROR_COPY = {
  401: '登入状态已过期，请重新登入。 · Your session has expired. Please sign in again.',
  429: '今日深度报告已达上限，请明天再来。 · You have reached today’s Deep Report limit. Please return tomorrow.',
  502: '报告生成暂时中断，你可以用同一次抽牌重试。 · Generation was interrupted. Retry with the same reading.',
};

function CardsSummary({ reading }) {
  const cards = Array.isArray(reading?.cards) ? reading.cards : [];
  if (!cards.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }} aria-label="抽到的牌 · Drawn cards">
      {cards.map((item, index) => {
        const card = byNum[item?.n];
        return (
          <span key={`${item?.n}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f5ecd9', color: '#6d5d3c', borderRadius: 999, padding: '3px 8px', fontSize: 10.5 }}>
            <span aria-hidden="true">{card?.icon || '◦'}</span>
            {card ? `${String(card.n).padStart(2, '0')} ${card.cn} · ${card.en}` : `#${item?.n}`}
          </span>
        );
      })}
    </div>
  );
}

export default function PortalClient({ email, initialReports }) {
  const supabase = useMemo(() => createClient(), []);
  const [latest, setLatest] = useState(null);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [errorState, setErrorState] = useState(null);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState(Array.isArray(initialReports) ? initialReports : []);
  const [open, setOpen] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
          message: ERROR_COPY[response.status] || data.message || '操作失败，请稍后再试。 · Something went wrong. Please try again.',
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
      };
      setReport(data.content);
      setReports((current) => [fresh, ...current.filter((item) => item.id !== fresh.id)]);
      setOpen(fresh.id);
    } catch {
      setErrorState({
        status: 0,
        message: '网络连接中断，请检查网络后重试。 · The connection was interrupted. Check your network and try again.',
        readingId: retryReadingId,
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeReport(id) {
    const confirmed = window.confirm('确定删除这份报告吗？此操作无法撤销。\nDelete this report? This cannot be undone.');
    if (!confirmed) return;

    setDeletingId(id);
    setErrorState(null);
    try {
      const deleted = await deleteReport(supabase, id);
      if (!deleted) throw new Error('not_deleted');
      setReports((current) => current.filter((item) => item.id !== id));
      if (open === id) setOpen(null);
    } catch {
      setErrorState({ status: 0, message: '无法删除报告，请稍后再试。 · Could not delete the report. Please try again.' });
    } finally {
      setDeletingId(null);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign('/');
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '0 0 40px' }}>
      <style>{`
        @keyframes portal-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .portal-spinner { animation: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '4px 16px 0', fontSize: 12.5, color: '#7a6f5a' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>已登入 · {email}</span>
        <button type="button" onClick={signOut} style={{ flex: '0 0 auto', border: 'none', background: 'transparent', color: '#b5842b', fontWeight: 600, cursor: 'pointer' }}>登出 · Sign out</button>
      </div>

      <CardDeck onReading={setLatest} />

      <div style={{ padding: '0 16px' }}>
        <section aria-labelledby="deep-report-title" style={{ background: '#fffdf8', border: '1px solid #e6d9bd', borderRadius: 18, padding: 18, marginTop: 4 }}>
          <div id="deep-report-title" style={{ fontWeight: 800, color: '#2a2622' }}>深度报告 · Deep Report</div>
          <div style={{ fontSize: 12.5, color: '#7a6f5a', margin: '4px 0 10px' }}>
            {latest ? '已捕捉本次抽牌，可生成报告。 · This reading is ready.' : '先在上方抽一次牌。 · Draw above first.'}
          </div>
          <label htmlFor="reflection-question" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>反思问题 · Reflection question</label>
          <textarea id="reflection-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000}
            placeholder="（可选）此刻你想觉察的问题或情境… Optional: a question or situation you're reflecting on"
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 64, padding: 10, borderRadius: 10, border: '1.5px solid #cdbf9e', fontSize: 13, resize: 'vertical' }} />
          <button type="button" onClick={() => generate()} disabled={!latest || busy}
            style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 10, border: 'none', background: '#2a2622', color: '#f3e6bf', fontWeight: 700, fontSize: 15, cursor: !latest || busy ? 'default' : 'pointer', opacity: !latest || busy ? 0.55 : 1 }}>
            {busy ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="portal-spinner" aria-hidden="true" style={{ width: 14, height: 14, border: '2px solid #7e715a', borderTopColor: '#f3e6bf', borderRadius: '50%', animation: 'portal-spin .8s linear infinite' }} />
                生成中… · Generating
              </span>
            ) : '生成深度报告 · Generate'}
          </button>
          {busy && <div role="status" aria-live="polite" style={{ textAlign: 'center', color: '#8a7f6c', fontSize: 11.5, marginTop: 7 }}>已等待 {elapsed} 秒 · {elapsed}s elapsed</div>}

          {errorState && (
            <div role="alert" style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid #e5b6a7', background: '#fff2ed', color: '#913f2c', fontSize: 12.5, lineHeight: 1.55 }}>
              <div>{errorState.message}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {errorState.status === 401 && <Link href="/login?next=/portal" style={{ color: '#913f2c', fontWeight: 800 }}>重新登入 · Sign in</Link>}
                {errorState.status === 502 && errorState.readingId && (
                  <button type="button" onClick={() => generate(errorState.readingId)} disabled={busy} style={{ border: 0, borderRadius: 999, padding: '7px 12px', background: '#913f2c', color: '#fff', cursor: busy ? 'wait' : 'pointer', fontWeight: 700 }}>
                    用同一次抽牌重试 · Retry this reading
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {report && (
          <section aria-label="最新深度报告 · Latest Deep Report" style={{ background: '#fffdf8', border: '1px solid #e6d9bd', borderRadius: 18, padding: '6px 18px 18px', marginTop: 14 }}>
            <Markdownish text={report} />
          </section>
        )}

        <section aria-labelledby="history-title" style={{ marginTop: 22 }}>
          <div id="history-title" style={{ fontWeight: 800, color: '#2a2622', marginBottom: 8 }}>历史报告 · History</div>
          {reports.length === 0 ? (
            <div style={{ background: 'rgba(255,253,248,.72)', border: '1px dashed #d8c8a6', borderRadius: 14, padding: '22px 18px', textAlign: 'center', color: '#7a6f5a' }}>
              <div aria-hidden="true" style={{ fontSize: 24, marginBottom: 5 }}>✦</div>
              <div style={{ fontWeight: 700, color: '#4f4638' }}>还没有历史报告 · No reports yet</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>完成一次抽牌并生成报告后，会保存在这里。<br />Draw cards and generate a report to begin your history.</div>
            </div>
          ) : reports.map((item) => (
            <article key={item.id} style={{ background: '#fffdf8', border: '1px solid #eadfc4', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <button type="button" aria-expanded={open === item.id} onClick={() => setOpen(open === item.id ? null : item.id)}
                  style={{ minWidth: 0, flex: 1, textAlign: 'left', border: 'none', background: 'transparent', padding: '11px 14px', cursor: 'pointer', fontSize: 13 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: '#3a352e' }}>{new Date(item.created_at).toLocaleString()}</span>
                    <span style={{ flex: '0 0 auto', color: '#b5842b' }}>{open === item.id ? '收起 ▲' : '查看 ▼'}</span>
                  </span>
                  <CardsSummary reading={item.readings} />
                </button>
                <button type="button" aria-label="删除报告 · Delete report" onClick={() => removeReport(item.id)} disabled={deletingId === item.id}
                  style={{ flex: '0 0 auto', width: 52, border: 0, borderLeft: '1px solid #efe5d0', background: '#fffaf0', color: '#a34b38', cursor: deletingId === item.id ? 'wait' : 'pointer', fontSize: 16 }}>
                  {deletingId === item.id ? '…' : '⌫'}
                </button>
              </div>
              {open === item.id && <div style={{ borderTop: '1px solid #efe5d0', padding: '2px 14px 12px' }}><Markdownish text={item.content} /></div>}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

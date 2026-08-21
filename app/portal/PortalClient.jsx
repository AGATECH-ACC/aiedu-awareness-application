'use client';
import { useState } from 'react';
import CardDeck from '@/components/CardDeck';
import Markdownish from '@/components/Markdownish';
import { createClient } from '@/lib/supabase-browser';

export default function PortalClient({ email, initialReports }) {
  const supabase = createClient();
  const [latest, setLatest] = useState(null);   // last reading from the deck
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [report, setReport] = useState(null);    // freshly generated report
  const [reports, setReports] = useState(initialReports);
  const [open, setOpen] = useState(null);

  async function generate() {
    if (!latest) return;
    setBusy(true); setErr(''); setReport(null);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...latest, question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      setReport(data.content);
      setReports((r) => [{ id: data.reportId, content: data.content, created_at: new Date().toISOString(), readings: { mode: latest.mode } }, ...r]);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '0 0 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 0', fontSize: 12.5, color: '#7a6f5a' }}>
        <span>已登入 · {email}</span>
        <button onClick={signOut} style={{ border: 'none', background: 'transparent', color: '#b5842b', fontWeight: 600, cursor: 'pointer' }}>登出 Sign out</button>
      </div>

      {/* Draw (reuses the Layer 1 deck; captures each reading) */}
      <CardDeck onReading={setLatest} />

      {/* Deep report generator */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ background: '#fffdf8', border: '1px solid #e6d9bd', borderRadius: 18, padding: 18, marginTop: 4 }}>
          <div style={{ fontWeight: 800, color: '#2a2622' }}>深度报告 · Deep Report</div>
          <div style={{ fontSize: 12.5, color: '#7a6f5a', margin: '4px 0 10px' }}>
            {latest ? '已捕捉本次抽牌，可生成报告。' : '先在上方抽一次牌。 Draw above first.'}
          </div>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="（可选）此刻你想觉察的问题或情境… Optional: a question or situation you're reflecting on"
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 64, padding: 10, borderRadius: 10, border: '1.5px solid #cdbf9e', fontSize: 13, resize: 'vertical' }} />
          <button onClick={generate} disabled={!latest || busy}
            style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 10, border: 'none', background: '#2a2622', color: '#f3e6bf', fontWeight: 700, fontSize: 15, cursor: !latest || busy ? 'default' : 'pointer', opacity: !latest || busy ? 0.55 : 1 }}>
            {busy ? '生成中… Generating (5–15s)' : '生成深度报告 · Generate'}
          </button>
          {err && <div style={{ color: '#b04a2e', fontSize: 12.5, marginTop: 8 }}>{err}</div>}
        </div>

        {report && (
          <div style={{ background: '#fffdf8', border: '1px solid #e6d9bd', borderRadius: 18, padding: '6px 18px 18px', marginTop: 14 }}>
            <Markdownish text={report} />
          </div>
        )}

        {/* History */}
        {reports.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontWeight: 800, color: '#2a2622', marginBottom: 8 }}>历史报告 · History</div>
            {reports.map((r) => (
              <div key={r.id} style={{ background: '#fffdf8', border: '1px solid #eadfc4', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
                <button onClick={() => setOpen(open === r.id ? null : r.id)}
                  style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '11px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#3a352e' }}>{new Date(r.created_at).toLocaleString()}</span>
                  <span style={{ color: '#b5842b' }}>{open === r.id ? '收起 ▲' : '查看 ▼'}</span>
                </button>
                {open === r.id && <div style={{ padding: '0 14px 12px' }}><Markdownish text={r.content} /></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ReportDocument from '@/components/ReportDocument';
import TopNav from '@/components/TopNav';
import { byNum } from '@/lib/cards';
import { getReport } from '@/lib/db';
import { createServerSupabase } from '@/lib/supabase-server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const metadata = {
  title: '我的觉察报告 · My Awareness Report',
  robots: { index: false, follow: false },
};

function formattedDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kuala_Lumpur',
  });
}

function spreadLabel(mode) {
  if (mode === 1) return '单张 · Single';
  if (mode === 4) return '内在小孩 · Inner Child';
  return '三张牌 · Three-card';
}

export default async function PersonalReportPage({ params }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id || '')) notFound();

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/portal/reports/${id}`)}`);

  const report = await getReport(supabase, { id, userId: user.id });
  if (!report?.content) notFound();

  const reading = Array.isArray(report.readings) ? report.readings[0] : report.readings;
  const cards = Array.isArray(reading?.cards) ? reading.cards : [];

  return (
    <main className="client-report-page">
      <TopNav user={user} />
      <div className="client-report-shell">
        <Link className="client-report-back" href="/portal#my-reports">← 返回历史报告 · Back to report history</Link>

        <header className="client-report-header">
          <div>
            <span>PERSONAL REPORT · 我的报告</span>
            <h1>我的觉察报告 · My awareness report</h1>
            <p>{user.email}</p>
          </div>
          <div className="client-report-status is-private">
            <strong>私人报告 · Private report</strong>
            <small>生成于 · Created {formattedDate(report.created_at)}</small>
          </div>
        </header>

        <section className="client-report-summary" aria-label="抽牌摘要 · Reading summary">
          <div>
            <span>牌阵 · Spread</span>
            <strong>{spreadLabel(reading?.mode)}</strong>
          </div>
          <div className="client-report-card-list">
            {cards.map((item, index) => {
              const card = byNum[item?.n];
              return (
                <span key={`${item?.n}-${index}`}>
                  {card ? `${String(card.n).padStart(2, '0')} ${card.cn} · ${card.en}` : `#${item?.n}`}
                </span>
              );
            })}
          </div>
          {report.is_public && report.share_token ? (
            <Link className="client-report-recipient-view" href={`/r/${report.share_token}`}>开启公开页面 · Open public view ↗</Link>
          ) : null}
        </section>

        <ReportDocument report={report} reading={reading} />
      </div>
    </main>
  );
}

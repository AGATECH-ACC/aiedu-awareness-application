import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReportDocument from '@/components/ReportDocument';
import { readingReportTitle } from '@/lib/cards';
import { createServerSupabase } from '@/lib/supabase-server';
import ReportBackButton from './ReportBackButton';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const loadPublicReport = cache(async (token) => {
  if (!UUID_PATTERN.test(token || '')) return null;
  const supabase = createServerSupabase();
  let { data, error } = await supabase.rpc('get_public_report_v2', { token });
  if (error?.code === 'PGRST202') {
    ({ data, error } = await supabase.rpc('get_public_report', { token }));
  }
  if (error) {
    console.error('Unable to load public report', error);
    return null;
  }
  return data?.[0] || null;
});

export async function generateMetadata({ params }) {
  const report = await loadPublicReport(params.token);
  if (!report) return { title: '报告不存在 · Report not found', robots: { index: false, follow: false } };

  const title = readingReportTitle(report.mode);
  const description = '一份温柔、双语的自我觉察与反思报告。A gentle bilingual reflection from the Happy Life Awareness Cards.';
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/r/${params.token}`,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] },
  };
}

export default async function PublicReportPage({ params }) {
  const report = await loadPublicReport(params.token);
  if (!report) notFound();
  const reading = Array.isArray(report.cards) ? {
    mode: report.mode,
    spread_key: report.spread_key,
    question: report.question,
    cards: report.cards,
  } : null;

  return (
    <main className="public-report-page">
      <div className="public-report-shell">
        <header className="public-report-header">
          <ReportBackButton />
          <Link href="/" className="public-report-brand">
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 25, fontWeight: 700, letterSpacing: 2 }}>幸福人生觉察卡</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 12, letterSpacing: 3.2, color: '#a9863c', marginTop: 4 }}>HAPPY LIFE AWARENESS CARDS</div>
          </Link>
          <span aria-hidden="true" />
        </header>

        <ReportDocument report={report} reading={reading} createdAt={report.created_at} primaryTitle />

        <div className="public-report-disclaimer">
          用于自我觉察与反思，不是心理诊断、治疗或医疗建议。<br />For self-reflection only — not diagnosis, therapy, or medical advice.
        </div>

        <aside className="public-report-cta">
          <div>也为自己抽一张牌 · Draw a card for yourself</div>
          <Link href="/draw">体验觉察卡 · Try the deck</Link>
        </aside>
      </div>
    </main>
  );
}

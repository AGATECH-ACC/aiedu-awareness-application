import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdownish from '@/components/Markdownish';
import { createServerSupabase } from '@/lib/supabase-server';
import ReportBackButton from './ReportBackButton';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const loadPublicReport = cache(async (token) => {
  if (!UUID_PATTERN.test(token || '')) return null;
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('get_public_report', { token });
  if (error) {
    console.error('Unable to load public report', error);
    return null;
  }
  return data?.[0] || null;
});

export async function generateMetadata({ params }) {
  const report = await loadPublicReport(params.token);
  if (!report) return { title: '报告不存在 · Report not found', robots: { index: false, follow: false } };

  const title = '一份幸福人生觉察报告 · A Happy Life Awareness Report';
  const description = '一份温柔、双语的自我觉察与反思报告。A gentle bilingual reflection from the Happy Life Awareness Cards.';
  return {
    title,
    description,
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

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)', color: '#2a2622', padding: '20px 16px 46px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header className="public-report-header">
          <ReportBackButton />
          <Link href="/" className="public-report-brand">
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 25, fontWeight: 700, letterSpacing: 2 }}>幸福人生觉察卡</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 10, letterSpacing: 3.5, color: '#a9863c', marginTop: 4 }}>HAPPY LIFE AWARENESS CARDS</div>
          </Link>
          <span aria-hidden="true" />
        </header>

        <article style={{ background: '#fffdf8', border: '1px solid #e2d5b8', borderRadius: 20, boxShadow: '0 10px 36px rgba(80,60,30,.09)', padding: '12px clamp(18px, 5vw, 38px) 30px' }}>
          <div style={{ borderBottom: '1px solid #eadfc4', padding: '14px 0 12px', marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px, 4vw, 28px)', margin: 0 }}>深度觉察报告 · Deep Awareness Report</h1>
            <time dateTime={report.created_at} style={{ display: 'block', color: '#92846c', fontSize: 11.5, marginTop: 6 }}>
              {new Date(report.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </div>
          <Markdownish text={report.content} />
          <div style={{ borderTop: '1px solid #eadfc4', marginTop: 24, paddingTop: 15, color: '#8a7d68', textAlign: 'center', fontSize: 11.5, lineHeight: 1.65 }}>
            用于自我觉察与反思，不是心理诊断、治疗或医疗建议。<br />For self-reflection only — not diagnosis, therapy, or medical advice.
          </div>
        </article>

        <aside style={{ textAlign: 'center', marginTop: 22, color: '#6f624e' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 17 }}>也为自己抽一张牌 · Draw a card for yourself</div>
          <Link href="/draw" style={{ display: 'inline-block', marginTop: 10, padding: '10px 18px', borderRadius: 999, background: '#b5842b', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>体验觉察卡 · Try the deck</Link>
        </aside>
      </div>
    </main>
  );
}

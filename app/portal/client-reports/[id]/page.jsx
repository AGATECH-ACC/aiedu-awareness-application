import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ReportDocument from '@/components/ReportDocument';
import TopNav from '@/components/TopNav';
import { hasAwarenessAccess } from '@/lib/awareness-access';
import { byNum, readingSpreadLabel } from '@/lib/cards';
import { getEducatorDelivery, getProfile } from '@/lib/db';
import { createServerSupabase } from '@/lib/supabase-server';
import DeliveryRetryButton from './DeliveryRetryButton';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const metadata = {
  title: '客户觉察报告',
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

function statusLabel(status) {
  if (status === 'sent') return '已寄出';
  if (status === 'failed') return '寄送失败';
  return '准备中';
}

export default async function ClientReportPage({ params }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id || '')) notFound();

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !hasAwarenessAccess(user)) {
    redirect(`/login?next=${encodeURIComponent(`/portal/client-reports/${id}`)}&error=invite-required`);
  }

  const [profile, delivery] = await Promise.all([
    getProfile(supabase, user.id),
    getEducatorDelivery(supabase, { deliveryId: id, educatorId: user.id }),
  ]);
  if (profile?.role !== 'educator' || !delivery) notFound();

  const report = Array.isArray(delivery.report) ? delivery.report[0] : delivery.report;
  if (!report?.content) notFound();
  const reading = Array.isArray(report.readings) ? report.readings[0] : report.readings;
  const cards = Array.isArray(reading?.cards) ? reading.cards : [];

  return (
    <main className="client-report-page">
      <TopNav user={user} />
      <div className="client-report-shell">
        <Link className="client-report-back" href="/portal#client-reports">← 返回客户报告</Link>

        <header className="client-report-header">
          <div>
            <span>客户报告</span>
            <h1>{delivery.recipient_name}</h1>
            <p>{delivery.recipient_email}</p>
          </div>
          <div className={`client-report-status is-${delivery.status}`}>
            <strong>{statusLabel(delivery.status)}</strong>
            <small>建立于 {formattedDate(delivery.created_at)}</small>
            {delivery.emailed_at ? <small>寄出于 {formattedDate(delivery.emailed_at)}</small> : null}
          </div>
        </header>

        <section className="client-report-summary" aria-label="抽牌摘要">
          <div>
            <span>牌阵</span>
            <strong>{readingSpreadLabel(reading?.mode, reading?.spread_key)}</strong>
          </div>
          <div className="client-report-card-list">
            {cards.map((item, index) => {
              const card = byNum[item?.n];
              return (
                <span key={`${item?.n}-${index}`}>
                  {card ? `${String(card.n).padStart(2, '0')} ${card.cn}` : `#${item?.n}`}
                </span>
              );
            })}
          </div>
          {report.is_public && report.share_token ? (
            <Link className="client-report-recipient-view" href={`/r/${report.share_token}`}>开启收件人页面 ↗</Link>
          ) : null}
        </section>

        {delivery.status === 'failed' ? <DeliveryRetryButton deliveryId={delivery.id} /> : null}

        <ReportDocument report={report} reading={reading} />
      </div>
    </main>
  );
}

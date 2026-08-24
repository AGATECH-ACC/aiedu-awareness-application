'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CardsThree,
  FileText,
  ListBullets,
  MagnifyingGlass,
  PaperPlaneTilt,
  UsersThree,
} from '@phosphor-icons/react';
import { byNum, readingSpreadLabel } from '@/lib/cards';

function deliveryDate(value) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  });
}

function deliveryLabel(status) {
  if (status === 'sent') return '已寄出 · Sent';
  if (status === 'failed') return '寄送失败 · Failed';
  return '准备中 · Pending';
}

function deliveryReading(delivery) {
  const report = Array.isArray(delivery?.report) ? delivery.report[0] : delivery?.report;
  const reading = Array.isArray(report?.readings) ? report.readings[0] : report?.readings;
  return reading || null;
}

function deliveryCard(delivery) {
  const reading = deliveryReading(delivery);
  const first = Array.isArray(reading?.cards) ? reading.cards[0] : null;
  return byNum[first?.n] || null;
}

function cardImage(card) {
  return card ? `/cards/front-${String(card.n).padStart(2, '0')}.png` : '/cards/back-1.png';
}

function ReportThumbnail({ card, size = 'large' }) {
  return (
    <div className={`admin-report-thumbnail is-${size}`}>
      <Image
        src={cardImage(card)}
        alt={card ? `第 ${String(card.n).padStart(2, '0')} 张：${card.cn} · Card ${card.n}: ${card.en}` : '觉察卡背面 · Awareness card back'}
        width={320}
        height={448}
        sizes={size === 'small' ? '72px' : '(max-width: 720px) 112px, 126px'}
      />
    </div>
  );
}

function ReportStatus({ status }) {
  return <span className={`admin-report-status is-${status || 'pending'}`}>{deliveryLabel(status)}</span>;
}

function EmptyReports({ filtered }) {
  return (
    <div className="admin-records-empty">
      <FileText size={28} weight="duotone" aria-hidden="true" />
      <strong>{filtered ? '没有符合条件的报告 · No matching reports' : '还没有客户报告 · No client reports yet'}</strong>
      <p>{filtered ? '请调整搜索或筛选条件。 · Try another search or filter.' : '完成第一次客户抽牌后，报告会显示在这里。 · Complete a client reading to start your report library.'}</p>
    </div>
  );
}

function ReportCard({ delivery }) {
  const card = deliveryCard(delivery);
  const reading = deliveryReading(delivery);

  return (
    <article className="admin-report-card">
      <div className="admin-report-card-main">
        <ReportThumbnail card={card} />
        <div className="admin-report-card-copy">
          <span className="admin-report-eyebrow">{reading ? readingSpreadLabel(reading.mode, reading.spread_key) : 'AWAITING CARD · 等待卡牌'}</span>
          <h3>{card ? `${card.cn} · ${card.en}` : '觉察报告 · Awareness report'}</h3>
          <strong>{delivery.recipient_name}</strong>
          <span>{delivery.recipient_email}</span>
          <time dateTime={delivery.created_at}>{deliveryDate(delivery.created_at)}</time>
          <ReportStatus status={delivery.status} />
        </div>
      </div>
      <Link className="admin-report-card-link" href={`/portal/client-reports/${delivery.id}`}>
        <span>查看报告 · View report</span>
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </article>
  );
}

function ReportListItem({ delivery }) {
  const card = deliveryCard(delivery);
  const reading = deliveryReading(delivery);

  return (
    <article className="admin-report-row">
      <ReportThumbnail card={card} size="small" />
      <div className="admin-report-row-recipient">
        <strong>{delivery.recipient_name}</strong>
        <span>{delivery.recipient_email}</span>
      </div>
      <div className="admin-report-row-card">
        <span>{reading ? readingSpreadLabel(reading.mode, reading.spread_key) : '卡牌 · Card'}</span>
        <strong>{card ? `${String(card.n).padStart(2, '0')} ${card.cn} · ${card.en}` : '等待卡牌 · Awaiting card'}</strong>
      </div>
      <time dateTime={delivery.created_at}>{deliveryDate(delivery.created_at)}</time>
      <ReportStatus status={delivery.status} />
      <Link className="admin-report-row-link" href={`/portal/client-reports/${delivery.id}`} aria-label={`查看 ${delivery.recipient_name} 的报告 · View report for ${delivery.recipient_name}`}>
        <ArrowRight size={19} aria-hidden="true" />
      </Link>
    </article>
  );
}

export default function AdminReportRecords({ deliveries }) {
  const records = Array.isArray(deliveries) ? deliveries : [];
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [layout, setLayout] = useState('cards');

  const metrics = useMemo(() => {
    const clients = new Set(records.map((item) => item.recipient_email?.trim().toLowerCase()).filter(Boolean));
    const now = new Date();
    const sentThisMonth = records.filter((item) => {
      if (item.status !== 'sent') return false;
      const date = new Date(item.emailed_at || item.created_at);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;
    return { reports: records.length, clients: clients.size, sentThisMonth };
  }, [records]);

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return records
      .filter((item) => status === 'all' || item.status === status)
      .filter((item) => {
        if (!normalizedQuery) return true;
        const card = deliveryCard(item);
        const reading = deliveryReading(item);
        const spread = reading ? readingSpreadLabel(reading.mode, reading.spread_key) : '';
        return [item.recipient_name, item.recipient_email, card?.cn, card?.en, spread]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        const difference = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return sort === 'newest' ? difference : -difference;
      });
  }, [query, records, sort, status]);

  const filtered = Boolean(query.trim() || status !== 'all');

  return (
    <section className="admin-records" aria-labelledby="admin-records-heading">
      <h2 id="admin-records-heading" className="sr-only">客户报告记录 · Client report records</h2>

      <div className="admin-metrics" aria-label="报告摘要 · Report summary">
        <div className="admin-metric">
          <FileText size={27} weight="duotone" aria-hidden="true" />
          <div><strong>{metrics.reports}</strong><span>总报告数 · Total reports</span></div>
        </div>
        <div className="admin-metric">
          <UsersThree size={29} weight="duotone" aria-hidden="true" />
          <div><strong>{metrics.clients}</strong><span>服务客户 · Clients</span></div>
        </div>
        <div className="admin-metric">
          <PaperPlaneTilt size={28} weight="duotone" aria-hidden="true" />
          <div><strong>{metrics.sentThisMonth}</strong><span>本月已发送 · Sent this month</span></div>
        </div>
      </div>

      <div className="admin-record-toolbar">
        <label className="admin-record-search">
          <MagnifyingGlass size={19} aria-hidden="true" />
          <span className="sr-only">搜索客户或邮箱 · Search client or email</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索客户或邮箱 · Search client or email" />
        </label>
        <label className="admin-record-select">
          <span className="sr-only">筛选状态 · Filter status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">全部状态 · All statuses</option>
            <option value="sent">已寄出 · Sent</option>
            <option value="pending">准备中 · Pending</option>
            <option value="failed">寄送失败 · Failed</option>
          </select>
        </label>
        <label className="admin-record-select">
          <span className="sr-only">日期排序 · Sort by date</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">最新优先 · Newest first</option>
            <option value="oldest">最早优先 · Oldest first</option>
          </select>
        </label>
        <div className="admin-layout-toggle" aria-label="显示方式 · View style">
          <button type="button" className={layout === 'list' ? 'is-active' : ''} aria-pressed={layout === 'list'} onClick={() => setLayout('list')}>
            <ListBullets size={18} aria-hidden="true" /><span>列表 · List</span>
          </button>
          <button type="button" className={layout === 'cards' ? 'is-active' : ''} aria-pressed={layout === 'cards'} onClick={() => setLayout('cards')}>
            <CardsThree size={19} aria-hidden="true" /><span>卡片 · Cards</span>
          </button>
        </div>
      </div>

      {visibleRecords.length ? (
        <div className={layout === 'cards' ? 'admin-report-grid' : 'admin-report-list'}>
          {visibleRecords.map((delivery) => (
            layout === 'cards'
              ? <ReportCard delivery={delivery} key={delivery.id} />
              : <ReportListItem delivery={delivery} key={delivery.id} />
          ))}
        </div>
      ) : <EmptyReports filtered={filtered} />}
    </section>
  );
}

import Image from 'next/image';
import Markdownish from '@/components/Markdownish';
import { byNum, CHAPTERS, readingReportTitle } from '@/lib/cards';

function formattedReportDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  });
}

export default function ReportDocument({ report, reading, createdAt = null, primaryTitle = false }) {
  const cards = Array.isArray(reading?.cards) ? reading.cards : [];
  const visualCards = cards
    .map((item, index) => {
      const card = byNum[item?.n];
      if (!card) return null;
      return {
        ...item,
        card,
        index,
        chapter: CHAPTERS[card.ch],
      };
    })
    .filter(Boolean);
  const leadCard = visualCards[0]?.card;
  const Heading = primaryTitle ? 'h1' : 'h2';
  const reportDate = formattedReportDate(createdAt);

  return (
    <article className="client-report-document">
      <div className="client-report-document-title">
        <span>幸福人生觉察卡</span>
        <Heading>{readingReportTitle(reading?.mode)}</Heading>
        {reportDate ? <time dateTime={createdAt}>{reportDate}</time> : null}
      </div>

      {visualCards.length ? (
        <section
          className={`client-report-card-showcase card-count-${visualCards.length}`}
          aria-label="本次牌阵"
        >
          <div className="client-report-card-visuals">
            {visualCards.map(({ card, chapter, position_cn: positionCn, index }) => (
              <figure className="client-report-card-figure" key={`${card.n}-${index}`}>
                <div className="client-report-card-image-frame">
                  <Image
                    src={`/cards/front-${String(card.n).padStart(2, '0')}.png`}
                    alt={`第 ${String(card.n).padStart(2, '0')} 张：${card.cn}`}
                    width={556}
                    height={934}
                    sizes={visualCards.length === 1 ? '(max-width: 640px) 58vw, 230px' : '(max-width: 640px) 38vw, 170px'}
                    priority={index === 0}
                  />
                </div>
                <figcaption>
                  <span>{positionCn || `位置 ${index + 1}`}</span>
                  <strong>{String(card.n).padStart(2, '0')} {card.cn}</strong>
                  <small style={{ color: chapter?.color }}>{chapter?.cn}</small>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="client-report-card-orientation">
            <span>本次觉察</span>
            <h3>
              {visualCards.length === 1
                ? leadCard.cn
                : `${visualCards.length} 张牌的觉察路径`}
            </h3>
            {reading?.question ? (
              <blockquote>
                <strong>你的情境</strong>
                <p>{reading.question}</p>
              </blockquote>
            ) : null}
            <p>{leadCard.text_cn}</p>
            <div className="client-report-reading-note">
              <strong>阅读方式</strong>
              <p>先停留在牌面感受，再进入下方解读。把有共鸣的内容留下，不符合你经验的部分可以放下。</p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="client-report-body">
        <Markdownish text={report.content} />
      </div>
    </article>
  );
}

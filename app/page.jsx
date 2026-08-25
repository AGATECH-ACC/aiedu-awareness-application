import Image from 'next/image';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import { hasAwarenessAccess } from '@/lib/awareness-access';
import { createServerSupabase } from '@/lib/supabase-server';

const benefits = [
  {
    number: '01',
    title: '听见真实的自己',
    en: 'Hear yourself clearly',
    body: '把模糊的感受，转化成可以被理解、被回应的内在语言。',
  },
  {
    number: '02',
    title: '看见新的选择',
    en: 'See another choice',
    body: '从惯性反应中退一步，发现此刻仍然握在手里的选择。',
  },
  {
    number: '03',
    title: '走出温柔的一步',
    en: 'Take one gentle step',
    body: '不追求一次改变所有事，只找到今天真正做得到的行动。',
  },
];

const ritual = [
  ['停一停', 'Pause', '给自己一个完整的呼吸，把注意力带回此刻。'],
  ['抽一张', 'Draw', '带着一个真实的问题，抽取当下最需要看见的主题。'],
  ['写下来', 'Reflect', '回应牌面的问题，留下今天的觉察与下一步。'],
];

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const awarenessUser = hasAwarenessAccess(user) ? user : null;

  return (
    <main className="awareness-home">
      <TopNav user={awarenessUser} variant="card" />

      <section className="home-hero" aria-labelledby="home-heading">
        <Image
          className="home-hero-image"
          src="/editorial/awareness-hero-still-life.png"
          alt="幸福人生觉察卡置于温暖纸面上的卡组"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 1280px"
        />
        <div className="home-hero-copy">
          <p className="home-kicker">AiEDU · LEARN · GROW · LOVE</p>
          <h1 id="home-heading">幸福人生<br />觉察卡</h1>
          <p className="home-hero-en" lang="en">HAPPY LIFE AWARENESS CARDS</p>
          <p className="home-hero-lead">
            用一张卡，让心慢下来。<br />
            看见此刻，也看见新的选择。
            <span lang="en">One card. One honest pause. One step closer to yourself.</span>
          </p>
          <div className="home-hero-actions">
            <Link className="home-button home-button--primary" href="/draw">抽一张牌 · Draw a card</Link>
            <a className="home-button home-button--quiet" href="#discover">认识这副卡 · Discover</a>
          </div>
          <ul className="home-hero-details" aria-label="卡牌特点">
            <li><strong>40</strong><span>张觉察主题<br /><i>Awareness themes</i></span></li>
            <li><strong>中 · EN</strong><span>双语引导<br /><i>Bilingual prompts</i></span></li>
            <li><strong>1</strong><span>个温柔行动<br /><i>Gentle next step</i></span></li>
          </ul>
        </div>
      </section>

      <section className="home-story home-section" id="discover" aria-labelledby="story-heading">
        <div className="home-story-image home-image-frame">
          <Image
            src="/editorial/awareness-reflection-ritual.png"
            alt="在晨光中抽取觉察卡的安静日常仪式"
            fill
            loading="eager"
            sizes="(max-width: 860px) 92vw, 560px"
          />
          <p>“答案未必马上出现，<br />但诚实的看见已经是开始。”</p>
        </div>
        <div className="home-story-copy">
          <p className="home-kicker">01 · MEET THE DECK</p>
          <h2 id="story-heading">这不是预测未来，<br />而是看见当下</h2>
          <p className="home-section-lead">
            幸福人生觉察卡，是一套为日常自我对话而设计的双语卡牌。每张卡从一个生活主题出发，用一幅画、一个问题和一项练习，陪你靠近真实感受。
          </p>
          <p className="home-section-en" lang="en">
            A bilingual reflection deck designed to turn a busy moment into a clear, compassionate conversation with yourself.
          </p>
          <div className="home-note">
            <span>适合独处觉察、日记书写，也可用于教练与陪伴对话。</span>
            <i lang="en">For personal reflection, journaling, coaching, and meaningful conversation.</i>
          </div>
        </div>
      </section>

      <section className="home-why" aria-labelledby="why-heading">
        <div className="home-why-inner">
          <div className="home-why-title">
            <p className="home-kicker">02 · WHY AWARENESS</p>
            <h2 id="why-heading">我们不是缺少答案，<br />而是太久没有停下来听</h2>
            <p>
              生活越快，我们越容易在情绪、期待和习惯之间自动前进。觉察不是分析更多，而是在行动之前，为自己多留一个选择。
            </p>
            <span lang="en">Awareness creates a small space between what happens and how you respond.</span>
          </div>
          <ol className="home-why-list">
            <li>
              <span>01</span>
              <div><strong>当思绪很满</strong><small>Give the noise a name</small><p>把散乱的念头聚焦成一个此刻真正重要的问题。</p></div>
            </li>
            <li>
              <span>02</span>
              <div><strong>当感受说不清</strong><small>Meet what you feel</small><p>借由图像与提问，更安全地靠近尚未说出口的感受。</p></div>
            </li>
            <li>
              <span>03</span>
              <div><strong>当选择很困难</strong><small>Choose with intention</small><p>看见习惯之外的可能，再决定下一步如何回应。</p></div>
            </li>
          </ol>
        </div>
      </section>

      <section className="home-benefits home-section" aria-labelledby="benefits-heading">
        <div className="home-benefits-copy">
          <p className="home-kicker">03 · WHAT IT CULTIVATES</p>
          <h2 id="benefits-heading">一次觉察，<br />为生活带来三种改变</h2>
          <p className="home-section-lead">持续练习，不是为了成为另一个人，而是更清楚地成为自己。</p>
          <div className="home-benefit-list">
            {benefits.map((benefit) => (
              <article key={benefit.number}>
                <span>{benefit.number}</span>
                <div>
                  <h3>{benefit.title}</h3>
                  <i lang="en">{benefit.en}</i>
                  <p>{benefit.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="home-benefits-image home-image-frame">
          <Image
            src="/editorial/awareness-card-spread.png"
            alt="真实、匮乏之井与成就三张幸福人生觉察卡"
            fill
            loading="eager"
            sizes="(max-width: 860px) 92vw, 600px"
          />
          <div className="home-image-caption">
            <span>40 个生活主题</span>
            <i lang="en">From authenticity to achievement</i>
          </div>
        </div>
      </section>

      <section className="home-ritual" aria-labelledby="ritual-heading">
        <div className="home-ritual-heading">
          <p className="home-kicker">A THREE-MINUTE RITUAL</p>
          <h2 id="ritual-heading">给自己三分钟，完成一次觉察</h2>
          <p lang="en">A simple ritual you can return to, whenever you need it.</p>
        </div>
        <ol className="home-ritual-steps">
          {ritual.map(([title, en, body], index) => (
            <li key={en}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <i lang="en">{en}</i>
              <p>{body}</p>
            </li>
          ))}
        </ol>
        <Link className="home-button home-button--primary home-ritual-button" href="/draw">
          开始今天的觉察 · Begin today
        </Link>
      </section>

      <section className="home-continue" aria-label="继续觉察旅程 · Continue your awareness journey">
        <div>
          <p>CONTINUE YOUR AWARENESS JOURNEY</p>
          <h2>把今天的觉察，留给未来的自己</h2>
          <span>
            登入后可保存抽牌记录、体验完整牌阵，并生成深度报告。
          </span>
        </div>
        <Link href={user ? '/portal' : '/login'}>
          {user ? '进入门户 · Portal' : '登入 · Sign in'}
        </Link>
      </section>

      <footer className="home-footer">
        <span>AiEDU · 幸福人生觉察卡</span>
        <span>一张卡片 · 一次觉察 · 一个更幸福的自己</span>
      </footer>
    </main>
  );
}

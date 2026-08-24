import Image from 'next/image';

export default function AuthShell({ children }) {
  return (
    <main className="auth-page">
      <div className="auth-frame">
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
          <Image
            className={`auth-corner auth-corner--${corner}`}
            src="/brand/card-corner-alpha.png"
            alt=""
            width={96}
            height={96}
            aria-hidden="true"
            key={corner}
          />
        ))}

        <section className="auth-content" aria-labelledby="auth-title">
          <header className="auth-brand">
            <Image
              className="auth-brand-logo"
              src="/brand/aiedu-awareness-logo-alpha.png"
              alt="AiEDU · Ai 育赋能教育学院"
              width={340}
              height={155}
              priority
            />
            <h1 id="auth-title">幸福人生觉察卡</h1>
            <p className="auth-brand-en" lang="en">HAPPY LIFE AWARENESS CARDS</p>
            <div className="auth-brand-divider" aria-hidden="true" />
            <p className="auth-brand-promise">觉察 · 选择 · 行动 · 创造幸福人生</p>
            <p className="auth-brand-promise-en" lang="en">Awareness · Choice · Action · Create a happier life</p>
          </header>

          <div className="auth-workspace">{children}</div>
        </section>

        <aside className="auth-visual" aria-label="幸福人生觉察卡 · Happy Life Awareness Cards">
          <Image
            className="auth-botanical"
            src="/brand/botanical-branch-transparent.png"
            alt=""
            width={934}
            height={1684}
            aria-hidden="true"
          />
          <Image
            className="auth-card-art"
            src="/cards/back-1.png"
            alt="幸福人生觉察卡牌背 · Happy Life Awareness Card back"
            width={556}
            height={934}
            priority
          />
        </aside>
      </div>
    </main>
  );
}

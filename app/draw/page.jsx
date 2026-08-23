import CardDeck from '@/components/CardDeck';
import TopNav from '@/components/TopNav';
import { createServerSupabase } from '@/lib/supabase-server';

export const metadata = {
  title: '免费抽牌 · Free Card Draw',
  description: '抽取一张幸福人生觉察卡，暂停片刻，看见此刻的自己。',
};

export default async function DrawPage({ searchParams }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const initialMethod = searchParams?.method === 'input' ? 'input' : 'draw';

  return (
    <main className="awareness-landing awareness-draw-page">
      <TopNav user={user} variant="card" />

      <section className="landing-title" aria-labelledby="draw-page-heading">
        <div className="landing-title-kicker">FREE ONE-CARD AWARENESS</div>
        <h1 id="draw-page-heading">免费抽一张觉察卡</h1>
        <div className="landing-title-en">DRAW ONE AWARENESS CARD</div>
        <p>
          停一停 · 看见 · 选择<br />
          <span>Pause. Notice. Choose your next honest step.</span>
        </p>
      </section>

      <CardDeck singleOnly landing initialMethod={initialMethod} />

      <footer className="landing-footer">
        <span>AiEDU · 幸福人生觉察卡</span>
        <span>一张卡片 · 一次觉察 · 一个更幸福的自己</span>
      </footer>
    </main>
  );
}

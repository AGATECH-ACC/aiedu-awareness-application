import TopNav from '@/components/TopNav';
import CardDeck from '@/components/CardDeck';
import { createServerSupabase } from '@/lib/supabase-server';

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main style={{ background: 'radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)', minHeight: '100vh' }}>
      <TopNav user={user} />
      <CardDeck />
      {!user && (
        <div style={{ maxWidth: 460, margin: '0 auto', padding: '0 16px 40px', textAlign: 'center' }}>
          <div style={{ background: '#fffdf8', border: '1px solid #e6d9bd', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 800, color: '#2a2622' }}>想要更深的解读？</div>
            <div style={{ fontSize: 13, color: '#7a6f5a', margin: '6px 0 12px' }}>
              登入后可保存抽牌记录，并生成 AI 深度报告。<br />Sign in to save readings and generate a deep report.
            </div>
            <a href="/login" style={{ display: 'inline-block', background: '#b5842b', color: '#fff', padding: '10px 20px', borderRadius: 999, textDecoration: 'none', fontWeight: 700 }}>登入 · Sign in</a>
          </div>
        </div>
      )}
    </main>
  );
}

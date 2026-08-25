import Link from 'next/link';

export default function PublicReportNotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)', color: '#2a2622' }}>
      <div style={{ maxWidth: 430, textAlign: 'center', background: '#fffdf8', border: '1px solid #e2d5b8', borderRadius: 20, padding: '34px 26px', boxShadow: '0 10px 34px rgba(80,60,30,.08)' }}>
        <div aria-hidden="true" style={{ color: '#b5842b', fontFamily: 'Georgia, serif', fontSize: 48 }}>404</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, margin: '8px 0' }}>这份报告无法开启</h1>
        <p style={{ color: '#786d5c', fontSize: 16, lineHeight: 1.7 }}>连结可能无效、已关闭分享，或报告已经移动。</p>
        <Link href="/draw" style={{ display: 'inline-block', marginTop: 8, background: '#b5842b', color: '#fff', borderRadius: 999, padding: '10px 18px', textDecoration: 'none', fontWeight: 700 }}>体验觉察卡</Link>
      </div>
    </main>
  );
}

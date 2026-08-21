import Link from 'next/link';

export default function TopNav({ user }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      maxWidth: 900, margin: '0 auto', padding: '14px 18px',
    }}>
      <Link href="/" style={{ textDecoration: 'none', fontWeight: 800, letterSpacing: 1, color: '#2a2622' }}>
        觉察卡 <span style={{ color: '#b5842b', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 400 }}>Awareness</span>
      </Link>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5 }}>
        <Link href="/" style={{ color: '#7a6f5a', textDecoration: 'none' }}>抽牌 Draw</Link>
        {user ? (
          <Link href="/portal" style={{ background: '#2a2622', color: '#f3e6bf', padding: '7px 14px', borderRadius: 999, textDecoration: 'none', fontWeight: 700 }}>我的门户 Portal</Link>
        ) : (
          <Link href="/login" style={{ background: '#b5842b', color: '#fff', padding: '7px 14px', borderRadius: 999, textDecoration: 'none', fontWeight: 700 }}>登入 Sign in</Link>
        )}
      </div>
    </nav>
  );
}

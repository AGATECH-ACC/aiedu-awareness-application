import { ImageResponse } from 'next/og';

export const alt = '幸福人生觉察卡 · Happy Life Awareness Cards';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4ead7', color: '#2a2622', padding: 64 }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', border: '3px solid #b5842b', borderRadius: 36, background: '#fffaf0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: 999, background: 'rgba(181,132,43,.12)', right: -120, top: -180 }} />
          <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: 999, background: 'rgba(77,125,98,.10)', left: -100, bottom: -180 }} />
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '76px 90px' }}>
            <div style={{ color: '#a2782c', fontSize: 24, letterSpacing: 8 }}>AiEDU · 觉察 · 选择 · 行动</div>
            <div style={{ display: 'flex', fontFamily: 'serif', fontSize: 72, fontWeight: 700, marginTop: 30 }}>幸福人生觉察卡</div>
            <div style={{ display: 'flex', color: '#6b5e49', fontFamily: 'serif', fontSize: 34, letterSpacing: 3, marginTop: 12 }}>HAPPY LIFE AWARENESS CARDS</div>
            <div style={{ display: 'flex', color: '#776b58', fontSize: 25, marginTop: 36 }}>一张牌 · 一次觉察 · 一个更幸福的自己</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

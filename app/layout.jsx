export const metadata = {
  title: '幸福人生觉察卡 · Happy Life Awareness Cards',
  description: '觉察 · 选择 · 行动 · 创造幸福的自己 — draw a card, meet your inner child, receive a deep reflection.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://awareness.aiedu.academy'),
};

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

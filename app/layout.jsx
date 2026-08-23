import './globals.css';

const siteTitle = '幸福人生觉察卡 · Happy Life Awareness Cards';
const siteDescription = '觉察、选择、行动——抽一张幸福人生觉察卡，温柔地看见自己的内在世界。Draw a card for a gentle bilingual reflection.';

export const metadata = {
  title: { default: siteTitle, template: `%s · ${siteTitle}` },
  description: siteDescription,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://app.aiedu.academy'),
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
    url: '/',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: siteTitle }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/opengraph-image'],
  },
};

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

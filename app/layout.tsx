import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://hokkaido-travel-portal.vercel.app'),
  title: {
    default: 'HOKKAIDO CLIPS | 北海道の観光・グルメ・旅行情報ポータル',
    template: '%s | HOKKAIDO CLIPS',
  },
  description: '北海道のおすすめ観光スポット、絶景、地元グルメ、最新トラベル情報をショート動画とAIレポートでお届けする旅行ポータルサイトです。札幌、函館、小樽、富良野、美瑛など道内各地の見どころを詳しく解説。',
  keywords: [
    '北海道旅行',
    '北海道観光',
    '札幌観光',
    '函館',
    '小樽',
    '富良野',
    '北海道グルメ',
    'HOKKAIDO CLIPS',
  ],
  authors: [{ name: 'HOKKAIDO CLIPS 編集部' }],
  openGraph: {
    title: 'HOKKAIDO CLIPS | 北海道の観光・グルメ・旅行情報ポータル',
    description: '北海道のおすすめ観光スポット、絶景、地元グルメ、最新トラベル情報をショート動画とAIレポートでお届けする旅行ポータルサイトです。',
    url: 'https://hokkaido-travel-portal.vercel.app',
    siteName: 'HOKKAIDO CLIPS',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HOKKAIDO CLIPS | 北海道の観光・グルメ・旅行情報ポータル',
    description: '北海道の観光・グルメ・スポット情報をまとめたトラベルポータル。',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

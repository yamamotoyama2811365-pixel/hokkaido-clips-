import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'HOKKAIDO CLIPS | 北海道ショート動画 × AIトラベルコンシェルジュ',
  description: '北海道の魅力的なスポットや旅行動画、AIによる最適周遊ルート作成をお届けします。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/* Google AdSense グローバル共通タグ */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5776658615046901"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
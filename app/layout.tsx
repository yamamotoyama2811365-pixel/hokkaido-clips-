import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOKKAIDO CLIPS - 動画で旅する北海道",
  description: "ショート動画 × AIトラベルコンシェルジュ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark bg-slate-950">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
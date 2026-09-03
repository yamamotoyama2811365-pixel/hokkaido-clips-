'use client';

import React from 'react';

export default function HeroBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-cyan-500/30 shadow-[0_10px_50px_-10px_rgba(6,182,212,0.3)] mb-6 bg-slate-950 group">
      {/* 検索エンジン（SEO）用テキスト：画面には表示されずGoogleクローラーにのみ強力に認識される */}
      <div className="sr-only">
        <h1>SNSでバズる北海道をAIで見つける - 今最もHOT!な旅を。 HOKKAIDO CLIPS</h1>
        <p>
          AI×REALTIME HOKKAIDO TRAVEL。YouTubeショートやSNSからAIがトレンドを分析し、
          いま最もアツい北海道の観光名所、グルメ、ラーメン、ラベンダー畑、夜景を動画と一次情報から先読み発掘できるトラベルメディアです。
        </p>
      </div>

      {/* バキバキの完成トップバナー画像 */}
      <img
        src="/hero-banner.png"
        alt="SNSでバズる北海道をAIで見つける - 今最もHOT!な旅を。 HOKKAIDO CLIPS"
        className="w-full h-auto object-cover block select-none group-hover:scale-[1.01] transition duration-500"
        loading="eager"
      />
    </div>
  );
}

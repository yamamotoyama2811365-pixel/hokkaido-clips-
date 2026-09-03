'use client';

import React from 'react';

export default function HeroBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-[#070b14] border border-cyan-500/20 shadow-[0_0_50px_-10px_rgba(6,182,212,0.15)] text-white p-6 sm:p-10 lg:p-12 mb-6">
      {/* 背景のグリッド & ネオングロー */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1a2f_1px,transparent_1px),linear-gradient(to_bottom,#0e1a2f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* メイングリッド */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* 左側: キャッチコピー & サイト概要 */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-cyan-400/40 bg-cyan-950/40 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold tracking-wider text-cyan-300 uppercase">
              AI × Realtime Hokkaido Travel
            </span>
          </div>

          {/* メインキャッチコピー（1行でドカンと強調） */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 drop-shadow-[0_2px_20px_rgba(251,191,36,0.35)]">
              「いまSNSでバズる北海道」
            </span>
            <br />
            をAIで見つけよう！
          </h1>

          {/* ブランドタイトル */}
          <div className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 pt-1">
            HOKKAIDO CLIPS
          </div>

          {/* リード文 */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
            YouTubeショート等の最新SNS動画からリアルタイムの盛り上がりをAIが解析。
            <strong className="text-cyan-300 font-semibold">「いま行くべき旬スポット」を縦型動画と詳細ガイドで直感的に探せる</strong>
            次世代スマートトラベルメディアです。
          </p>
        </div>

        {/* 右側: サイバーグラフィック */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[240px]">
          <div className="absolute w-56 h-56 rounded-full border border-cyan-500/20 animate-ping opacity-25" />
          <div className="absolute w-44 h-44 rounded-full border border-fuchsia-500/30" />

          <svg className="w-full max-w-[320px] h-48 overflow-visible" viewBox="0 0 300 200">
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <path
              d="M 10 180 Q 150 180 270 30"
              fill="none"
              stroke="url(#curveGradient)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="270,18 285,30 268,42" fill="#ec4899" />
          </svg>

          <div className="absolute -top-2 right-4 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-xs sm:text-sm font-black shadow-lg shadow-pink-500/40 animate-bounce">
            🔥 バズる直前！
          </div>
          <div className="absolute top-16 left-6 px-3 py-1 rounded-full bg-cyan-900/80 border border-cyan-400/50 text-xs font-bold text-cyan-200 backdrop-blur-md shadow-md">
            📱 ショートで話題
          </div>
          <div className="absolute bottom-6 right-8 px-3 py-1 rounded-full bg-indigo-900/80 border border-indigo-400/50 text-xs font-bold text-indigo-200 backdrop-blur-md shadow-md">
            ⚡ AI急上昇検知
          </div>
        </div>
      </div>

      {/* 下段: 5連機能アイコンバー */}
      <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 text-lg border border-cyan-500/30">
              🤖
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">AIトレンド解析</div>
              <div className="text-[11px] text-slate-400">SNSから話題の兆しを発見</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-fuchsia-500/40 transition">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fuchsia-950 text-fuchsia-400 text-lg border border-fuchsia-500/30">
              📱
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">縦型ショート直結</div>
              <div className="text-[11px] text-slate-400">30秒で現地の空気を体感</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-950 text-amber-400 text-lg border border-amber-500/30">
              ⚡
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">リアルタイム速報</div>
              <div className="text-[11px] text-slate-400">今週・来週のホットな旬</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-950 text-blue-400 text-lg border border-blue-500/30">
              📖
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">肉厚ディープ解説</div>
              <div className="text-[11px] text-slate-400">見どころ＆巡り方を補完</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition col-span-2 sm:col-span-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-emerald-400 text-lg border border-emerald-500/30">
              📍
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">エリア即ピンポイント</div>
              <div className="text-[11px] text-slate-400">札幌・道東など一発検索</div>
            </div>
          </div>

        </div>

        <p className="mt-5 text-center text-xs sm:text-sm text-slate-400 leading-relaxed">
          AIがショート動画の熱量と最新観光データを解析。バズの兆しを見せる絶景・グルメ・イベントを
          <span className="text-cyan-300 font-semibold">「動画で直感チェック ➔ 記事で詳しく知る」</span>
          の最短ルートでお届けします！
        </p>
      </div>
    </div>
  );
}

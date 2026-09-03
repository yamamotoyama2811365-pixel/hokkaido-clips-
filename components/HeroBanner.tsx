'use client';

import React from 'react';

export default function HeroBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-[#070b14] border border-cyan-500/20 shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)] text-white p-6 sm:p-8 lg:p-10 mb-6">
      {/* 背景のグリッド & ネオングロー */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1a2f_1px,transparent_1px),linear-gradient(to_bottom,#0e1a2f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* メイングリッド */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* 左側: キャッチコピー & 概要 */}
        <div className="lg:col-span-7 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/40 bg-cyan-950/40 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-cyan-300 uppercase">
              AI × Realtime Hokkaido Travel
            </span>
          </div>

          {/* メインキャッチコピー */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight whitespace-normal">
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 drop-shadow-[0_2px_15px_rgba(251,191,36,0.35)]">
              SNSでバズる北海道
            </span>
            <br />
            <span className="inline-block text-white">
              をAIで見つけよう！
            </span>
          </h1>

          {/* リード文 */}
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl pt-1">
            YouTubeショート等の最新SNS動画からリアルタイムの盛り上がりをAIが解析。
            <strong className="text-cyan-300 font-semibold">「いま行くべき旬スポット」を縦型動画と詳細ガイドで直感的に探せる</strong>
            次世代スマートトラベルメディアです。
          </p>
        </div>

        {/* 右側: サイバーグラフィック */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[180px]">
          <div className="absolute w-44 h-44 rounded-full border border-cyan-500/20 animate-ping opacity-25" />
          <div className="absolute w-36 h-36 rounded-full border border-fuchsia-500/30" />

          <svg className="w-full max-w-[280px] h-36 overflow-visible" viewBox="0 0 300 200">
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

          <div className="absolute -top-1 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-xs font-black shadow-lg shadow-pink-500/40 animate-bounce">
            🔥 バズる直前！
          </div>
          <div className="absolute top-12 left-4 px-2.5 py-1 rounded-full bg-cyan-900/80 border border-cyan-400/50 text-[11px] font-bold text-cyan-200 backdrop-blur-md shadow-md">
            📱 ショートで話題
          </div>
          <div className="absolute bottom-4 right-6 px-2.5 py-1 rounded-full bg-indigo-900/80 border border-indigo-400/50 text-[11px] font-bold text-indigo-200 backdrop-blur-md shadow-md">
            ⚡ AI急上昇検知
          </div>
        </div>

      </div>
    </div>
  );
}

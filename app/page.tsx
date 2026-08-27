'use client';

import React, { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    // max-w と mx-auto を使って、左側に適度な余白（インデント）を保ったまま綺麗に左寄せにする
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-start px-6 md:px-16 py-10">
      <div className="w-full max-w-5xl space-y-6">
        
        {/* ヘッダータイトル部分 */}
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-teal-400">
            HOKKAIDO CLIPS
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            ショート動画とAIで探す北海道のローカル観光・グルメ・お土産
          </p>
        </header>

        {/* タブ切り替え部分 */}
        <nav className="flex justify-start gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm transition ${
              activeTab === 'all'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setActiveTab('gourmet')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm transition ${
              activeTab === 'gourmet'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            グルメ
          </button>
          <button
            onClick={() => setActiveTab('spot')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm transition ${
              activeTab === 'spot'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            観光スポット
          </button>
          <button
            onClick={() => setActiveTab('souvenir')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm transition ${
              activeTab === 'souvenir'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            お土産
          </button>
        </nav>

        {/* メインコンテンツエリア */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="text-3xl animate-bounce">🎬</div>
          <h2 className="text-lg font-semibold text-slate-200">
            ショート動画コンテンツを読み込み中...
          </h2>
          <p className="text-xs text-slate-400">
            札幌、小樽、函館、富良野などの魅力的なローカルスポットをショート動画でサクサク楽しめます。
          </p>
        </section>

        {/* フッター */}
        <footer className="text-xs text-slate-500 pt-4">
          &copy; 2026 HOKKAIDO CLIPS All Rights Reserved.
        </footer>

      </div>
    </main>
  );
}
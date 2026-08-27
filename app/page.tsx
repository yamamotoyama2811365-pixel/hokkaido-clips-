'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { supabase } from '@/app/supabase';

export default function Home() {
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClips() {
      try {
        const { data, error } = await supabase.from('clips').select('*');
        if (data) {
          setClips(data);
        }
      } catch (err) {
        console.error('Error fetching clips:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClips();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ヘッダータイトル */}
        <header className="text-center space-y-2 py-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            HOKKAIDO CLIPS
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            北海道の魅力的なスポットや旅行動画をお届けします
          </p>
        </header>

        {/* Google AdSense 横バナー広告エリア */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 my-6 text-center overflow-hidden shadow-lg">
          <p className="text-xs text-slate-500 mb-2">スポンサーリンク</p>
          <div className="flex justify-center">
            <ins
              className="adsbygoogle"
              style={{ display: "block", minWidth: "250px", width: "100%" }}
              data-ad-client="ca-pub-5776658615046901"
              data-ad-slot="6392139179"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
            <Script
              id="adsbygoogle-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
              }}
            />
          </div>
        </div>

        {/* メインコンテンツエリア（元々の動画・スポット一覧） */}
        <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-200">北海道クリップ一覧</h2>
          {loading ? (
            <div className="text-center py-12 text-slate-400 animate-pulse">
              HOKKAIDO CLIPS Loading...
            </div>
          ) : clips.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-cyan-300">札幌・小樽の定番スポット</h3>
                <p className="text-sm text-slate-400 mt-1">美しい夜景と美味しいグルメを満喫するモデルコース。</p>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-cyan-300">富良野・美瑛の絶景ドライブ</h3>
                <p className="text-sm text-slate-400 mt-1">広大な大自然と色鮮やかな花畑を巡るおすすめルート。</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clips.map((clip, index) => (
                <div key={index} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                  <h3 className="font-bold text-cyan-300">{clip.title || 'スポット'}</h3>
                  <p className="text-sm text-slate-400 mt-1">{clip.description || ''}</p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
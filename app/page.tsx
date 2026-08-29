'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // ブログ記事の取得
  useEffect(() => {
    fetch('/api/blogs')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.posts) {
          setBlogPosts(data.posts);
        }
      })
      .catch((err) => console.error('ブログの取得に失敗しました:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-16">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">北海道旅行ポータル</h1>
          <nav className="flex gap-4 text-sm font-medium">
            <a href="#spots" className="hover:text-blue-600">観光スポット</a>
            <a href="#blogs" className="hover:text-blue-600">観光ブログ</a>
            <a href="#concierge" className="hover:text-blue-600">AIコンシェルジュ</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6 space-y-10">
        
        {/* =========================================================
         * 1. 北海道観光地紹介の大きなバナーセクション（新規追加・独立）
         * ========================================================= */}
        <section className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-blue-900 to-indigo-800 text-white p-8 md:p-12">
          <div className="relative z-10 max-w-2xl">
            <span className="bg-blue-500 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Featured Content
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-4 leading-tight">
              魅力を発見！北海道観光地紹介コンテンツ
            </h2>
            <p className="text-blue-100 text-sm md:text-base mb-6 leading-relaxed">
              大自然、グルメ、温泉など、北海道の秘められた魅力や最新のスポット情報を毎日お届けします。あなたの次の旅の計画にぜひお役立てください。
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="#blogs" 
                className="bg-white text-blue-900 font-bold px-6 py-3 rounded-lg shadow hover:bg-blue-50 transition duration-200"
              >
                最新のブログ記事を見る
              </a>
              <a 
                href="#concierge" 
                className="bg-blue-700 bg-opacity-60 border border-blue-400 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200"
              >
                AIに相談してみる
              </a>
            </div>
          </div>
          {/* 背景の装飾的要素 */}
          <div className="absolute right-0 bottom-0 opacity-15 transform translate-x-10 translate-y-10 pointer-events-none">
            <span className="text-9xl font-black">HOKKAIDO</span>
          </div>
        </section>

        {/* =========================================================
         * 2. Googleアドワーズ枠（広告エリア）の復活
         * ========================================================= */}
        <section className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 shadow-sm">
          <div className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-1">スポンサーリンク (Google Ads)</div>
          <div className="h-24 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-sm">ここに広告が表示されます（Googleアドワーズ枠）</p>
          </div>
        </section>

        {/* =========================================================
         * 3.AIコンシェルジュ機能の復活
         * ========================================================= */}
        <section id="concierge" className="bg-white rounded-xl shadow-md p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 font-bold">🤖 AI</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">AIコンシェルジュ</h2>
              <p className="text-xs text-gray-500">北海道旅行のルートやおすすめスポットをAIになんでもご相談ください。</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-48 flex items-center justify-center text-gray-400 text-sm">
            （ここにAIチャット・コンシェルジュインターフェースが展開されます）
          </div>
        </section>

        {/* =========================================================
         * 4. 観光ブログ記事一覧セクション
         * ========================================================= */}
        <section id="blogs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">最新の観光ブログ・おすすめ記事</h2>
            <span className="text-xs text-gray-500">毎日自動更新中</span>
          </div>

          {blogPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogPosts.map((post, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-200">
                  <div className="h-40 bg-gray-200 relative flex items-center justify-center text-gray-400">
                    <span>No Image</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {post.area || '北海道'}
                    </span>
                    <h3 className="font-bold text-gray-800 line-clamp-2">{post.title_ja || post.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{post.content_ja || post.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">
              ブログ記事を読み込み中、またはまだ記事がありません。
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

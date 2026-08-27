'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// 完全に一致している正しい動画データ（すすきののスナック等のサムネイル）
const VIDEOS = [
  { id: '1', title: 'スナック初心者のわかりやすい一言 #すすきの', location: 'すすきの', category: 'night', thumbnail: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80' },
  { id: '2', title: 'すすきのをスナックストリートプロモームービー', location: 'すすきの', category: 'night', thumbnail: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=600&q=80' },
  { id: '3', title: '20代女子の子多数在籍！【スナックじゃが...', location: 'すすきの', category: 'night', thumbnail: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80' },
  { id: '4', title: '[初投稿]スナックオーナーがYouTube始...', location: 'すすきの', category: 'night', thumbnail: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80' },
  { id: '5', title: '同伴の金額ってどれくらい？ #スナック #...', location: 'すすきの', category: 'night', thumbnail: 'https://images.unsplash.com/photo-1553163147-622ab57be1c2?auto=format&fit=crop&w=600&q=80' },
  { id: '6', title: 'すすきの夜景と大人の隠れ家スポット', location: 'すすきの', category: 'spot', thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80' },
  { id: '7', title: '北海道のお美味しいお酒とワイナリー巡り', location: '札幌・余市', category: 'gourmet', thumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80' },
  { id: '8', title: '極上のウイスキーと楽しむ夜のバー', location: '札幌・すすきの', category: 'night', thumbnail: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=600&q=80' },
  { id: '9', title: '札幌のローカルフードを食べ歩き', location: '札幌・狸小路', category: 'gourmet', thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
  { id: '10', title: '北海道のお土産・限定スイーツ特集', location: '札幌駅', category: 'souvenir', thumbnail: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // お気に入り（マーク）の切り替え機能
  const toggleFavorite = (id: VercelID | string, e: React.MouseEvent) => {
    e.preventDefault();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // カテゴリや検索による絞り込み機能
  const filteredVideos = VIDEOS.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          video.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'favorites') {
      return favorites.includes(video.id) && matchesSearch;
    }
    if (selectedCategory !== 'all') {
      return video.category === selectedCategory && matchesSearch;
    }
    return matchesSearch;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* ヘッダー */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold">▶</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-wider text-slate-100">HOKKAIDO CLIPS</h1>
              <span className="text-[10px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded font-bold">APP</span>
            </div>
            <p className="text-xs text-slate-400">ショート動画とAIで探す北海道のローカル観光・グルメ・お土産</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectedCategory('favorites')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition ${selectedCategory === 'favorites' ? 'bg-teal-400 text-slate-950 font-bold border-teal-400' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
          >
            ❤️ マーク一覧 ({favorites.length})
          </button>
          <button className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">🇯🇵 日本語 ▾</button>
          <button className="text-xs bg-teal-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg">AIツアー自動作成</button>
        </div>
      </header>

      {/* スポンサーリンク枠 */}
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 text-center text-xs text-slate-400">
        スポンサーリンク
      </div>

      {/* 検索バー＆ハッシュタグ */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="店名、お土産名（白い恋人、ラーメン、スーツケース、防寒グッズなど）で検索..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] self-center mr-1">急上昇:</span>
          {['#ラーメン', '#ジンギスカン', '#スープカレー', '#白い恋人', '#ルタオ', '#コーンパン', '#夜パフェ', '#温泉', '#海鮮丼', '#スーツケース', '#防寒グッズ'].map((tag) => (
            <span 
              key={tag} 
              onClick={() => setSearchQuery(tag.replace('#', ''))}
              className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300 hover:border-teal-500 cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* カテゴリタブ（正常にクリックして絞り込める機能付き） */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button 
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap shadow-md transition ${selectedCategory === 'all' ? 'bg-teal-400 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
        >
          🔥 全て (注目)
        </button>
        <button 
          onClick={() => setSelectedCategory('favorites')}
          className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap transition ${selectedCategory === 'favorites' ? 'bg-teal-400 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
        >
          ❤️ マーク済み ({favorites.length})
        </button>
        <button 
          onClick={() => setSelectedCategory('gourmet')}
          className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap transition ${selectedCategory === 'gourmet' ? 'bg-teal-400 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
        >
          🍜 グルメ (Hot 20)
        </button>
        <button 
          onClick={() => setSelectedCategory('souvenir')}
          className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap transition ${selectedCategory === 'souvenir' ? 'bg-teal-400 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
        >
          🎁 限定土産 (Hot 20)
        </button>
        <button 
          onClick={() => setSelectedCategory('stay')}
          className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap transition ${selectedCategory === 'stay' ? 'bg-teal-400 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
        >
          🏨 宿泊・温泉 (Hot 20)
        </button>
        <button 
          onClick={() => setSelectedCategory('spot')}
          className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap transition ${selectedCategory === 'spot' ? 'bg-teal-400 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
        >
          📸 観光名所 (Hot 20)
        </button>
        <button 
          onClick={() => setSelectedCategory('night')}
          className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap transition ${selectedCategory === 'night' ? 'bg-teal-400 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
        >
          🌙 ナイト (すすきの・クラブ等)
        </button>
        <button 
          onClick={() => setSelectedCategory('prep')}
          className={`px-4 py-2 rounded-xl text-xs whitespace-nowrap transition ${selectedCategory === 'prep' ? 'bg-teal-400 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
        >
          🧳 旅行準備・必用品
        </button>
      </div>

      {/* メインレイアウト（左：動画一覧、右：AIコンシェルジュ） */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* 左側：動画エリア */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="text-amber-400">🔥</span> ホット＆新着トレンド動画
            </h2>
            <span className="text-xs text-slate-500">{filteredVideos.length} 件</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {filteredVideos.map((video) => {
              const isFav = favorites.includes(video.id);
              return (
                <Link 
                  key={video.id} 
                  href={`/clip/${video.id}`}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500 transition shadow-lg flex flex-col relative"
                >
                  <div className="aspect-[9/16] relative bg-black">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                    />
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-slate-950/80 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200">
                      {video.id}
                    </div>
                    <button 
                      onClick={(e) => toggleFavorite(video.id, e)}
                      className={`absolute top-2 right-2 p-1.5 rounded-full transition ${isFav ? 'text-red-500 bg-slate-950/80' : 'text-slate-300 bg-slate-950/50 hover:text-red-400'}`}
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-3 left-3 right-3 space-y-1">
                      <span className="text-[10px] text-teal-400 font-semibold">{video.location}</span>
                      <h3 className="text-xs font-bold text-slate-100 line-clamp-2 leading-tight">{video.title}</h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 右側：AIトラベルコンシェルジュパネル */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-teal-400 flex items-center gap-1.5">
                <span>🤖</span> AIトラベルコンシェルジュ
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                エリアと滞在時間を選ぶだけで、無理のない最適周遊ルートをご案内します。
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">1. 出発・観光エリアを選択</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500 text-teal-300 font-bold">
                  道央<span className="block text-[9px] text-slate-400 font-normal">札幌・小樽・千歳・定山渓</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                  道南<span className="block text-[9px] text-slate-600 font-normal">函館・登別・洞爺</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                  道北<span className="block text-[9px] text-slate-600 font-normal">富良野・美瑛・旭川・稚内</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                  道東<span className="block text-[9px] text-slate-600 font-normal">十勝・帯広・釧路・知床・網走</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">2. ツアー 滞在時間</span>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <button className="py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">2時間</button>
                <button className="py-2 rounded-xl bg-teal-400 text-slate-950 font-bold">4時間</button>
                <button className="py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">6時間</button>
                <button className="py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">🌙 夜だけ</button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
              <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-950 text-teal-400" />
              <span>現在地を出発地点にする</span>
            </div>

            <button className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:opacity-90 transition text-xs flex items-center justify-center gap-2">
              <span>🚀 周遊ツアールートを自動生成</span>
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
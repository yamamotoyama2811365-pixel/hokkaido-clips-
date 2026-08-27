import Link from 'next/link';

const VIDEOS = [
  { id: '1', title: 'すすきの隠れ家BAR やまざき（日本最...', location: '札幌・すすきの', thumbnail: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=600&q=80' },
  { id: '2', title: '夜パフェ専門店 パフェテリア バル (Pa...', location: '札幌・すすきの', thumbnail: 'https://images.unsplash.com/photo-1553163147-622ab57be1c2?auto=format&fit=crop&w=600&q=80' },
  { id: '3', title: '積丹半島 神威岬（シャコタンブルーの大...', location: '積丹・神威岬', thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80' },
  { id: '4', title: '小樽運河（ガス灯が灯る歴史的石造倉庫...', location: '小樽・運河', thumbnail: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=600&q=80' },
  { id: '5', title: '函館山山頂展望台（日本三大夜景）', location: '函館・元町', thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
];

export default function HomePage() {
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
            <p className="text-xs text-slate-400">ショート動画 × AIトラベルコンシェルジュ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">❤️ マーク一覧 (7)</button>
          <button className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">🇯🇵 日本語 ▾</button>
          <button className="text-xs bg-teal-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg">AIツアー自動作成</button>
        </div>
      </header>

      {/* バナーセクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">HIS限定セール</span>
          <h2 className="text-sm font-bold mt-2 text-slate-100">HIS 北海道ツアー大感謝祭！往復航空券＋ホテル</h2>
          <p className="text-xs text-slate-400 mt-1">2泊3日 19,800円〜！レンタカー付きプランも対象</p>
        </div>
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <span className="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded font-bold">JTB厳選</span>
          <h2 className="text-sm font-bold mt-2 text-slate-100">JTB 露天風呂付き客室＆高級温泉旅館特集</h2>
          <p className="text-xs text-slate-400 mt-1">登別・定山渓・洞爺湖の極上宿で使える限定クーポン配布中</p>
        </div>
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">楽天トラベル</span>
          <h2 className="text-sm font-bold mt-2 text-slate-100">航空券＋宿泊パック！ポイント最大15倍還元</h2>
          <p className="text-xs text-slate-400 mt-1">JAL・ANA便を自由に組み合わせ！宿予約もOK</p>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-400 text-slate-950 whitespace-nowrap shadow-md">🔥 全て (注目)</button>
        <button className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap hover:bg-slate-800">❤️ マーク済み (7)</button>
        <button className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap hover:bg-slate-800">🍜 グルメ (Hot 20)</button>
        <button className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap hover:bg-slate-800">🎁 限定土産 (Hot 20)</button>
        <button className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap hover:bg-slate-800">🏨 宿泊・温泉 (Hot 20)</button>
        <button className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap hover:bg-slate-800">📸 観光名所 (Hot 20)</button>
      </div>

      {/* 検索バー＆ハッシュタグ */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="relative">
          <input 
            type="text" 
            placeholder="店名、お土産名（白い恋人、ラーメン、スーツケース、防寒グッズなど）で検索..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] self-center mr-1">急上昇:</span>
          {['#ラーメン', '#ジンギスカン', '#スープカレー', '#白い恋人', '#ルタオ', '#コーンパン', '#夜パフェ', '#温泉', '#海鮮丼', '#スーツケース', '#防寒グッズ'].map((tag) => (
            <span key={tag} className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300 hover:border-teal-500 cursor-pointer">{tag}</span>
          ))}
        </div>
      </div>

      {/* メインレイアウト（左：動画一覧、右：AIコンシェルジュ） */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* 左側：動画エリア (3カラム) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="text-amber-400">🔥</span> ホット＆新着トレンド動画
            </h2>
            <span className="text-xs text-slate-500">200 件</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {VIDEOS.map((video) => (
              <Link 
                key={video.id} 
                href={`/clip/${video.id}`}
                className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500 transition shadow-lg flex flex-col"
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
                  <div className="absolute top-2 right-2 text-slate-300">❤️</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3 space-y-1">
                    <span className="text-[10px] text-teal-400 font-semibold">{video.location}</span>
                    <h3 className="text-xs font-bold text-slate-100 line-clamp-2 leading-tight">{video.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
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
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">2. ツアー 滞在時間</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button className="py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">2時間</button>
                <button className="py-2 rounded-xl bg-teal-400 text-slate-950 font-bold">4時間</button>
                <button className="py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">6時間</button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
              <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-950 text-teal-400" />
              <span>現在地を出発地点にする</span>
            </div>

            <button className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:opacity-90 transition text-xs flex items-center justify-center gap-2">
              <span>🚀 周遊ツアーを自動生成</span>
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
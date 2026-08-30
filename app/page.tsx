"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";

type Genre = "all" | "food" | "souvenir" | "stay" | "spot" | "night" | "travel_gear" | "blogs";
type AreaRegion = "central" | "south" | "east" | "north";
type VideoPlatform = "youtube" | "tiktok" | "instagram";

interface SouvenirItem {
  name: string;
  description: string;
  image_url?: string;
  amazon_keyword?: string;
  rakuten_keyword?: string;
}

interface SpotItem {
  id: string;
  title: string;
  genre: Genre;
  area: string;
  region?: AreaRegion;
  video_thumb: string;
  video_type: VideoPlatform;
  video_id: string;
  crowd_status: "low" | "medium" | "high";
  crowd_text: string;
  ai_summary: string;
  best_time: string;
  map_query: string;
  created_at?: string;
  souvenirs?: SouvenirItem[];
}

interface BlogPost {
  id: string;
  slug?: string;
  title?: string;
  title_ja?: string;
  title_ko?: string;
  title_en?: string;
  タイトル_ja?: string;
  タイトル_ko?: string;
  タイトル_en?: string;
  content?: string;
  content_ja?: string;
  content_ko?: string;
  content_en?: string;
  コンテンツ_ja?: string;
  コンテンツ_ko?: string;
  コンテンツ_en?: string;
  summary?: string;
  area?: string;
  thumbnail_url?: string;
  created_at?: string;
}

// 🎨 データベースの正しいthumbnail_urlを最優先で返す安全な写真取得関数
function getDynamicSmartPhoto(post: BlogPost): string {
  if (post.thumbnail_url && post.thumbnail_url.startsWith("http")) {
    return post.thumbnail_url;
  }
  return "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80";
}

const REGION_MAP: { id: AreaRegion; label: string; sub: string; keywords: string[] }[] = [
  { id: "central", label: "道央", sub: "札幌・小樽・千歳・定山渓", keywords: ["札幌", "小樽", "すすきの", "千歳", "空港", "定山渓", "大通", "円山"] },
  { id: "south", label: "道南", sub: "函館・登別・洞爺湖", keywords: ["函館", "登別", "洞爺", "北斗", "五稜郭", "室蘭"] },
  { id: "north", label: "道北", sub: "富良野・美瑛・旭川・稚内", keywords: ["富良野", "美瑛", "旭川", "青い池", "旭山動物園", "稚内"] },
  { id: "east", label: "道東", sub: "十勝・帯広・釧路・知床・網走", keywords: ["帯広", "十勝", "釧路", "知床", "網走", "阿寒", "摩周"] },
];

const POPULAR_SEARCH_TAGS = ["ジンギスカン", "スープカレー", "ラーメン", "白い恋人", "ルタオ", "夜パフェ", "温泉", "海鮮丼", "スーツケース", "防寒グッズ"];

const SYNONYM_MAP: Record<string, string[]> = {
  "ラーメン": ["ラーメン", "らーめん", "麺", "信玄", "一幻", "拉麺", "ramen"],
  "ジンギスカン": ["ジンギスカン", "松尾", "ラム", "成吉思汗", "羊肉", "だるま", "いただきます"],
  "スープカレー": ["スープカレー", "カレー", "garaku", "suage", "奥芝商店", "ラマイ"],
  "白い恋人": ["白い恋人", "石屋製菓", "ishiya", "白い恋人パーク"],
  "ルタオ": ["ルタオ", "letao", "ドゥーブルフロマージュ"],
  "温泉": ["温泉", "旅館", "定山渓", "登別", "onsen"],
  "海鮮丼": ["海鮮", "いくら", "ウニ", "カニ", "朝市", "サーモン"],
  "スーツケース": ["スーツケース", "キャリーケース", "パッキング"],
  "防寒グッズ": ["防寒", "ヒートテック", "スノーブーツ", "滑り止め", "手袋", "カイロ"],
};

const TRAVEL_GEAR_SPOTS: SpotItem[] = [
  {
    id: "gear-1",
    title: "超軽量キャスタースーツケース（拡張機能付）",
    genre: "travel_gear",
    area: "旅前・準備",
    video_thumb: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&auto=format&fit=crop&q=80",
    video_type: "youtube",
    video_id: "L_LUpnjgPso",
    crowd_status: "low",
    crowd_text: "旅行前マストバイ",
    ai_summary: "お土産（白い恋人やラーメンBOXなど）で荷物が増えがちな北海道旅行に最適な容量拡張ファスナー付きスーツケース。",
    best_time: "出発2週間前までの準備",
    map_query: "北海道 札幌市",
    souvenirs: [
      {
        name: "軽量フロントオープン スーツケース (機内持込対応)",
        description: "荷物の出し入れが簡単で空港での移動も快適。",
        image_url: "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=500&auto=format&fit=crop&q=80",
        amazon_keyword: "スーツケース 機内持ち込み フロントオープン 軽量",
        rakuten_keyword: "スーツケース 機内持ち込み フロントオープン",
      }
    ]
  },
  {
    id: "gear-2",
    title: "北海道の雪道・凍結路面用 靴底装着型スパイク",
    genre: "travel_gear",
    area: "旅前・防寒",
    video_thumb: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=800&auto=format&fit=crop&q=80",
    video_type: "youtube",
    video_id: "L_LUpnjgPso",
    crowd_status: "high",
    crowd_text: "冬季・残雪期必須",
    ai_summary: "普段のスニーカーやブーツの靴底にゴムでワンタッチ装着できる滑り止めスパイク。",
    best_time: "11月〜4月の旅行前",
    map_query: "北海道 札幌市",
    souvenirs: [
      {
        name: "携帯用 スノースパイク 靴底滑り止め",
        description: "凍結路面も安心して歩ける携帯用アイゼン。",
        image_url: "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=500&auto=format&fit=crop&q=80",
        amazon_keyword: "靴底 滑り止め スパイク 雪道",
        rakuten_keyword: "靴底 滑り止め スパイク 雪道",
      }
    ]
  }
];

function detectRegion(spot: Partial<SpotItem>): AreaRegion {
  const text = `${spot.title || ""} ${spot.area || ""} ${spot.ai_summary || ""}`.toLowerCase();
  for (const reg of REGION_MAP) {
    if (reg.keywords.some((k) => text.includes(k.toLowerCase()))) {
      return reg.id;
    }
  }
  return "central";
}

function cleanMapQuery(title: string, area: string): string {
  const q = title || "";
  if (q.includes("白い恋人")) return "白い恋人パーク 札幌市西区宮の沢2条2丁目11-36";
  if (q.includes("小樽運河")) return "小樽運河 小樽市港町5";
  if (q.includes("函館山") || q.includes("夜景")) return "函館山ロープウェイ 函館市元町19-7";
  return `${area} ${title}`.trim();
}

function resolveSpecificSouvenirs(spot: Partial<SpotItem>): SouvenirItem[] {
  const text = `${spot.title || ""} ${spot.ai_summary || ""}`.toLowerCase();
  if (text.includes("白い恋人")) {
    return [{
      name: "ISHIYA『白い恋人（ホワイト＆ブラック）』",
      description: "北海道土産の最高峰。香ばしいラングドシャ。",
      image_url: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=80",
      amazon_keyword: "白い恋人 石屋製菓",
      rakuten_keyword: "白い恋人 石屋製菓",
    }];
  }
  return [{
    name: "北海道特産『じゃがポックル』",
    description: "北海道産じゃがいも100%のサクサクプレミアムスナック。",
    image_url: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=80",
    amazon_keyword: "じゃがポックル",
    rakuten_keyword: "じゃがポックル",
  }];
}

function MultiVideoPlayer({ spot }: { spot: SpotItem }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isPlaying) {
    return (
      <div 
        onClick={() => setIsPlaying(true)}
        className="relative w-full h-full bg-black cursor-pointer group flex items-center justify-center overflow-hidden"
      >
        <img src={spot.video_thumb} alt={spot.title} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition duration-300" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="w-10 h-10 rounded-full bg-teal-500/90 text-white flex items-center justify-center text-sm shadow-xl group-hover:scale-110 transition">
          ▶
        </div>
        <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-200">
          タップして動画を再生
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${spot.video_id}?autoplay=1&playsinline=1&rel=0`}
        title={spot.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default function HokkaidoTravelApp() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState("ja");
  const [spots, setSpots] = useState<SpotItem[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<Genre | "bookmarks">("all");
  const [selectedRegion, setSelectedRegion] = useState<AreaRegion>("central");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeSpot, setActiveSpot] = useState<SpotItem | null>(null);
  const [stayDuration, setStayDuration] = useState("4");
  const [generatedPlan, setGeneratedPlan] = useState<SpotItem[] | null>(null);
  const [startFromCurrentLocation, setStartFromCurrentLocation] = useState(true);

  const [showBlogSection, setShowBlogSection] = useState(false);
  const [blogSearchQuery, setBlogSearchQuery] = useState("");
  const [visibleBlogCount, setVisibleBlogCount] = useState(10);

  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isAdCompleted, setIsAdCompleted] = useState(false);

  const planSectionRef = useRef<HTMLDivElement>(null);
  const activeVideoCardRef = useRef<HTMLDivElement>(null);
  const blogSectionRef = useRef<HTMLDivElement>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const handleSelectSpot = (spot: SpotItem) => {
    setActiveSpot(spot);
    setTimeout(() => {
      if (activeVideoCardRef.current) {
        activeVideoCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
  };

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("hk_lang_pref");
      if (savedLang) setCurrentLang(savedLang);
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hk_bookmarks");
      if (saved) setBookmarkedIds(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("hk_bookmarks", JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    try {
      localStorage.setItem("hk_lang_pref", langCode);
    } catch (err) {}
  };

  const getLocalizedTitle = (post: BlogPost) => {
    if (currentLang === "ko") return post.タイトル_ko || post.title_ko || post.タイトル_ja || post.title_ja || "무제";
    if (currentLang === "en") return post.タイトル_en || post.title_en || post.タイトル_ja || post.title_ja || "Hokkaido Travel Report";
    return post.タイトル_ja || post.title_ja || post.title || "無題のレポート";
  };

  const fetchSpotsAndBlogs = async () => {
    try {
      const { data: spotData } = await supabase.from("spots").select("*").order("created_at", { ascending: false });
      const rawList = spotData && spotData.length > 0 ? spotData : [];
      
      const cleanList = rawList.map((s: any) => ({
        ...s,
        video_id: s.video_id,
        video_type: "youtube" as VideoPlatform,
        map_query: cleanMapQuery(s.title, s.area),
        region: detectRegion(s),
        souvenirs: resolveSpecificSouvenirs(s),
      }));

      const fullArchive = [...cleanList, ...TRAVEL_GEAR_SPOTS];
      setSpots(fullArchive);
      if (!activeSpot && fullArchive.length > 0) setActiveSpot(fullArchive[0]);

      let blogData: any[] | null = null;
      let res1 = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (res1.data && res1.data.length > 0) {
        blogData = res1.data;
      } else {
        let res2 = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
        if (res2.data && res2.data.length > 0) blogData = res2.data;
      }

      if (blogData && blogData.length > 0) setBlogPosts(blogData);
    } catch (err) {
      console.error("データ取得例外:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpotsAndBlogs();
  }, []);

  const filteredBlogPosts = useMemo(() => {
    if (!blogSearchQuery.trim()) return blogPosts;
    const q = blogSearchQuery.toLowerCase().trim();
    return blogPosts.filter((post) => {
      const title = getLocalizedTitle(post).toLowerCase();
      const area = (post.area || "").toLowerCase();
      return title.includes(q) || area.includes(q);
    });
  }, [blogPosts, blogSearchQuery, currentLang]);

  const displayedBlogPosts = filteredBlogPosts.slice(0, visibleBlogCount);
  const bookmarkedSpots = useMemo(() => spots.filter((s) => bookmarkedIds.includes(s.id)), [spots, bookmarkedIds]);

  const filteredSpots = useMemo(() => {
    let list = spots;
    if (searchKeyword.trim()) {
      const rawQ = searchKeyword.toLowerCase().trim();
      const targetKeywords = SYNONYM_MAP[searchKeyword] || [rawQ];
      return list.map((spot) => {
        let score = 0;
        const titleLower = (spot.title || "").toLowerCase();
        for (const kw of targetKeywords) {
          if (titleLower.includes(kw.toLowerCase())) score += 100;
        }
        return { spot, score };
      }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).map((item) => item.spot);
    }
    if (selectedGenre === "all") list = spots.filter((s) => s.genre !== "travel_gear");
    else if (selectedGenre === "bookmarks") list = bookmarkedSpots;
    else list = list.filter((s) => s.genre === selectedGenre);
    return list;
  }, [spots, selectedGenre, searchKeyword, bookmarkedSpots]);

  const displayedSpots = searchKeyword.trim() ? filteredSpots : filteredSpots.slice(0, 20);

  const startGeneratingWithAd = (isFromBookmarks = false) => {
    setIsGeneratingModalOpen(true);
    setGenerationProgress(0);
    setIsAdCompleted(false);

    let plan: SpotItem[] = [];
    const regionSpots = spots.filter(s => s.region === selectedRegion && s.genre !== "travel_gear");
    const pool = regionSpots.length >= 3 ? regionSpots : spots.filter(s => s.genre !== "travel_gear");
    plan = [pool[0], pool[1], pool[2]].filter(Boolean);

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAdCompleted(true);
          setGeneratedPlan(plan);
          if (plan.length > 0) handleSelectSpot(plan[0]);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const getGoogleMapsRouteUrl = (plan: SpotItem[]) => {
    if (!plan || plan.length === 0) return "#";
    const start = startFromCurrentLocation ? "現在地" : (plan[0].map_query || plan[0].title);
    const destination = plan[plan.length - 1].map_query || plan[plan.length - 1].title;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(destination)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-teal-400 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🧭</div>
          <p className="text-xs tracking-wider">HOKKAIDO CLIPS Loading...</p>
        </div>
      </div>
    );
  }

  const currentRegionInfo = REGION_MAP.find(r => r.id === selectedRegion);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 pb-20">
      
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 md:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedGenre("all"); setShowBlogSection(false); setSearchKeyword(""); }}>
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-cyan-500 to-indigo-500 p-[1.5px]">
              <div className="w-full h-full bg-slate-900 rounded-[12.5px] flex items-center justify-center text-teal-300 font-black">▶</div>
            </div>
            <div>
              <span className="font-black text-sm sm:text-lg text-white">HOKKAIDO <span className="text-teal-400">CLIPS</span></span>
              <div className="text-[9px] sm:text-[11px] font-bold text-slate-300">SEOトラベルメディア</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700 text-xs py-1.5 px-2 rounded-xl"
            >
              <option value="ja">🇯🇵 日本語</option>
              <option value="ko">🇰🇷 한국어</option>
              <option value="en">🇺🇸 English</option>
            </select>
            <button 
              onClick={() => startGeneratingWithAd(false)}
              className="text-xs bg-teal-500 text-white font-extrabold px-3 py-1.5 rounded-xl"
            >
              🤖 AIツアー作成
            </button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* バナー */}
        <section className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-900 p-6 md:p-12 border border-teal-500/30">
          <div className="relative z-20 max-w-2xl">
            <span className="bg-teal-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full">SEO Optimized</span>
            <h2 className="text-2xl md:text-4xl font-black mt-3 mb-3 text-white">北海道人気観光地紹介！ブログ＆レポート</h2>
            <p className="text-slate-200 text-xs md:text-sm mb-6">検索エンジンからの流入に特化した長文SEO記事と、現地の魅力を伝える観光レポートをお届けします。</p>
            <button 
              onClick={() => {
                setShowBlogSection(true);
                setTimeout(() => {
                  if (blogSectionRef.current) blogSectionRef.current.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="bg-teal-400 text-slate-950 font-extrabold px-5 py-3 rounded-xl text-xs flex items-center gap-1.5"
            >
              <span>📖</span> 観光ブログ記事一覧を見る ({blogPosts.length}件)
            </button>
          </div>
        </section>

        {/* ★ ブログ一覧（<a> タグで確実に個別ページへ画面遷移） */}
        {showBlogSection && (
          <div ref={blogSectionRef} className="space-y-4 bg-slate-900/95 border border-teal-500/40 p-5 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h2 className="text-sm font-extrabold text-white">📖 ブログ＆レポート一覧（SEO個別ページ対応）</h2>
              <button onClick={() => setShowBlogSection(false)} className="px-3 py-1 bg-slate-800 text-xs text-slate-300 rounded-xl">✕ 閉じる</button>
            </div>

            <div className="space-y-3">
              {displayedBlogPosts.map((post) => {
                const smartPhoto = getDynamicSmartPhoto(post);
                const title = getLocalizedTitle(post);
                const targetUrl = `/blog/${post.slug || post.id}`;

                return (
                  <a 
                    key={post.id} 
                    href={targetUrl}
                    className="group bg-slate-950 border border-slate-800 hover:border-teal-500 rounded-xl p-3 flex items-center justify-between gap-4 transition cursor-pointer block"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
                        <img src={smartPhoto} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <span className="text-[10px] px-2 py-0.2 rounded bg-teal-950 text-teal-300">{post.area || "北海道"}</span>
                        <h3 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-teal-300">{title}</h3>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 bg-teal-500/10 group-hover:bg-teal-500 text-teal-300 group-hover:text-slate-950 font-extrabold text-xs rounded-lg transition flex items-center gap-1">
                      詳細を見る ➔
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* 動画一覧・コンシェルジュ等のUI */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:flex-1 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayedSpots.map((spot, idx) => (
                <div key={spot.id} onClick={() => handleSelectSpot(spot)} className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-[9/16] cursor-pointer shadow">
                  <img src={spot.video_thumb} alt={spot.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                  <div className="absolute bottom-0 inset-x-0 p-2.5">
                    <p className="text-[10px] text-teal-400">{spot.area}</p>
                    <h3 className="font-bold text-[11px] text-white truncate">{spot.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-[420px] space-y-5">
            {activeSpot && (
              <div ref={activeVideoCardRef} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                <div className="relative aspect-video bg-black">
                  <MultiVideoPlayer key={activeSpot.id} spot={activeSpot} />
                </div>
                <div className="p-5 space-y-4">
                  <h3 className="text-lg font-bold text-white">{activeSpot.title}</h3>
                  <p className="text-xs text-slate-300">{activeSpot.ai_summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

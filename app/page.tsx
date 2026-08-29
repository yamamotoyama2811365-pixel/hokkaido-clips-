"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Script from "next/script";
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
  slug: string;
  area: string;
  title_ja: string;
  content_ja: string;
  title_en?: string;
  content_en?: string;
  title_ko?: string;
  content_ko?: string;
  thumbnail_url: string;
  source_name?: string;
  source_url?: string;
  created_at?: string;
}

const REGION_MAP: { id: AreaRegion; label: string; sub: string; keywords: string[] }[] = [
  { id: "central", label: "道央", sub: "札幌・小樽・千歳・定山渓", keywords: ["札幌", "小樽", "すすきの", "千歳", "空港", "定山渓", "大通", "円山", "クロスホテル"] },
  { id: "south", label: "道南", sub: "函館・登別・洞爺湖", keywords: ["函館", "登別", "洞爺", "北斗", "五稜郭", "室蘭"] },
  { id: "north", label: "道北", sub: "富良野・美瑛・旭川・稚内", keywords: ["富良野", "美瑛", "旭川", "青い池", "旭山動物園", "稚内", "留萌"] },
  { id: "east", label: "道東", sub: "十勝・帯広・釧路・知床・網走", keywords: ["帯広", "十勝", "釧路", "知床", "網走", "阿寒", "摩周"] },
];

const POPULAR_SEARCH_TAGS = ["ジンギスカン", "スープカレー", "ラーメン", "白い恋人", "ルタオ", "夜パフェ", "温泉", "海鮮丼", "スーツケース", "防寒グッズ"];

const SYNONYM_MAP: Record<string, string[]> = {
  "ラーメン": ["ラーメン", "らーめん", "麺", "信玄", "一幻", "拉麺", "ramen"],
  "ジンギスカン": ["ジンギスカン", "松尾", "ラム", "成吉思汗", "羊肉", "だるま", "いただきます", "ふくろう亭", "jingisukan"],
  "スープカレー": ["スープカレー", "カレー", "garaku", "suage", "奥芝商店", "ラマイ", "ramai", "curry"],
  "白い恋人": ["白い恋人", "石屋製菓", "ishiya", "白い恋人パーク", "shiroi koibito"],
  "ルタオ": ["ルタオ", "letao", "ドゥーブルフロマージュ", "小樽洋菓子舗"],
  "コーンパン": ["コーンパン", "美瑛選果", "びえいのコーンパン"],
  "夜パフェ": ["夜パフェ", "シメパフェ", "締めパフェ", "パル", "パフェ", "parfait"],
  "温泉": ["温泉", "旅館", "定山渓", "登別", "滝本館", "ふる川", "onsen", "hot spring"],
  "海鮮丼": ["海鮮", "いくら", "ウニ", "カニ", "朝市", "サーモン", "鮭", "seafood"],
  "スーツケース": ["スーツケース", "キャリーケース", "パッキング", "圧縮バッグ"],
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
        description: "荷物の出し入れが簡単で空港や新千歳空港での移動も快適。",
        image_url: "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=500&auto=format&fit=crop&q=80",
        amazon_keyword: "スーツケース 機内持ち込み フロントオープン 軽量",
        rakuten_keyword: "スーツケース 機内持ち込み フロントオープン",
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
  if (q.includes("クロスホテル")) return "クロスホテル札幌 札幌市中央区北2条西2丁目23";
  if (q.includes("松尾ジンギスカン")) return "松尾ジンギスカン 札幌南1条店";
  if (q.includes("だるま")) return "成吉思汗だるま 本店 札幌市中央区南5条西4丁目";
  return `${area} ${title}`.trim();
}

function resolveSpecificSouvenirs(spot: Partial<SpotItem>): SouvenirItem[] {
  return [
    {
      name: "北海道特産『じゃがポックル（オホーツク焼き塩味）』",
      description: "北海道産じゃがいもを100%使用したサクサク食感の定番プレミアムスナック。",
      image_url: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=80",
      amazon_keyword: "じゃがポックル",
      rakuten_keyword: "じゃがポックル",
    }
  ];
}

function MultiVideoPlayer({ spot }: { spot: SpotItem }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isPlaying) {
    return (
      <div 
        onClick={() => setIsPlaying(true)}
        className="relative w-full h-full bg-black cursor-pointer group flex items-center justify-center overflow-hidden"
      >
        <img 
          src={spot.video_thumb} 
          alt={spot.title} 
          className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition duration-300"
        />
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
  const [currentLang, setCurrentLang] = useState("ja");
  const [spots, setSpots] = useState<SpotItem[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<Genre | "bookmarks">("all");
  const [selectedRegion, setSelectedRegion] = useState<AreaRegion>("central");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeSpot, setActiveSpot] = useState<SpotItem | null>(null);
  const [stayDuration, setStayDuration] = useState("4");
  const [generatedPlan, setGeneratedPlan] = useState<SpotItem[] | null>(null);
  const [startFromCurrentLocation, setStartFromCurrentLocation] = useState(true);

  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isAdCompleted, setIsAdCompleted] = useState(false);

  const planSectionRef = useRef<HTMLDivElement>(null);
  const activeVideoCardRef = useRef<HTMLDivElement>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const handleSelectSpot = (spot: SpotItem) => {
    setActiveSpot(spot);
    setSelectedBlog(null);
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

  // データの取得（スポット ＆ ブログ記事）
  const fetchData = async () => {
    try {
      // 1. スポット動画データの取得
      const { data: spotData } = await supabase
        .from("spots")
        .select("*")
        .order("created_at", { ascending: false });

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
      if (!activeSpot && fullArchive.length > 0) {
        setActiveSpot(fullArchive[0]);
      }

      // 2. ブログ記事データの取得
      const { data: blogData } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (blogData) {
        setBlogs(blogData);
      }
    } catch (err) {
      console.error("データ取得例外:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const bookmarkedSpots = useMemo(() => {
    return spots.filter((s) => bookmarkedIds.includes(s.id));
  }, [spots, bookmarkedIds]);

  // 検索またはジャンル別のフィルタリング
  const filteredSpots = useMemo(() => {
    let list = spots;

    if (searchKeyword.trim()) {
      const rawQ = searchKeyword.toLowerCase().trim();
      const targetKeywords = SYNONYM_MAP[searchKeyword] || [rawQ];

      return list
        .map((spot) => {
          let score = 0;
          const titleLower = (spot.title || "").toLowerCase();
          const summaryLower = (spot.ai_summary || "").toLowerCase();
          for (const kw of targetKeywords) {
            if (titleLower.includes(kw.toLowerCase())) score += 100;
            if (summaryLower.includes(kw.toLowerCase())) score += 40;
          }
          return { spot, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.spot);
    }

    if (selectedGenre === "all") {
      list = spots.filter((s) => s.genre !== "travel_gear");
    } else if (selectedGenre === "bookmarks") {
      list = bookmarkedSpots;
    } else {
      list = list.filter((s) => s.genre === selectedGenre);
    }

    return list;
  }, [spots, selectedGenre, searchKeyword, bookmarkedSpots]);

  const displayedSpots = searchKeyword.trim() ? filteredSpots : filteredSpots.slice(0, 20);

  // 言語に応じたブログのタイトル・本文を取得するヘルパー
  const getLocalizedBlogTitle = (blog: BlogPost) => {
    if (currentLang === "en" && blog.title_en) return blog.title_en;
    if (currentLang === "ko" && blog.title_ko) return blog.title_ko;
    return blog.title_ja;
  };

  const getLocalizedBlogContent = (blog: BlogPost) => {
    if (currentLang === "en" && blog.content_en) return blog.content_en;
    if (currentLang === "ko" && blog.content_ko) return blog.content_ko;
    return blog.content_ja;
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
      
      {/* ブランドヘッダー */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 md:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 group cursor-pointer" onClick={() => { setSelectedGenre("all"); setSearchKeyword(""); setSelectedBlog(null); }}>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-[14px] bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-500 p-[1.5px] shadow-[0_4px_20px_rgba(45,212,191,0.35)] group-hover:scale-105 transition-all duration-300">
                <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-[12.5px] flex items-center justify-center relative overflow-hidden">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-teal-400/20 flex items-center justify-center text-teal-300 font-black text-xs sm:text-sm">▶</div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-sm sm:text-lg md:text-xl tracking-wider text-white">
                    HOKKAIDO <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-sky-400 bg-clip-text text-transparent">CLIPS</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md bg-teal-950/80 border border-teal-500/40 text-[8px] sm:text-[9px] font-black text-teal-300">APP</span>
                </div>
                <div className="text-[9px] sm:text-[11px] font-bold text-slate-300">
                  <span>ショート動画</span> <span className="text-teal-400">×</span> <span>AI観光ブログメディア</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedGenre("bookmarks")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center gap-1 whitespace-nowrap transition ${
                selectedGenre === "bookmarks" ? "bg-rose-500/20 text-rose-300 border-rose-500/50" : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <span>❤️</span> <span>マーク一覧 ({bookmarkedIds.length})</span>
            </button>

            <select
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700/80 text-[11px] sm:text-xs font-bold py-1.5 sm:py-2 px-2 rounded-xl outline-none cursor-pointer whitespace-nowrap"
            >
              <option value="ja">🇯🇵 日本語</option>
              <option value="en">🇺🇸 English</option>
              <option value="ko">🇰🇷 한국어</option>
            </select>
          </div>

        </div>
      </header>

      {/* メインの全体コンテナ */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <div className="w-full lg:flex-1 space-y-6">
            
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm">🔍</span>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    if (e.target.value) setSelectedGenre("all");
                    setSelectedBlog(null);
                  }}
                  placeholder="DB全体から動画・スポットを検索..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-teal-400 rounded-xl text-xs md:text-sm text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap mr-1">急上昇:</span>
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (searchKeyword === tag) setSearchKeyword("");
                      else { setSelectedGenre("all"); setSearchKeyword(tag); setSelectedBlog(null); }
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* ジャンル＆ブログ切り替えタブ */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: "all", label: "🔥 全て (動画)" },
                { id: "blogs", label: `📖 おすすめ観光地紹介 (${blogs.length})` },
                { id: "food", label: "🍜 グルメ" },
                { id: "souvenir", label: "🎁 限定土産" },
                { id: "stay", label: "🏨 宿泊・温泉" },
                { id: "spot", label: "🏔️ 観光名所" },
                { id: "night", label: "🌙 ナイト" },
                { id: "travel_gear", label: "🧳 旅行準備" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedGenre(tab.id as any);
                    setSearchKeyword("");
                    if (tab.id !== "blogs") setSelectedBlog(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedGenre === tab.id && !searchKeyword
                      ? tab.id === "blogs"
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                        : "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 📖 【おすすめ観光地紹介】ブログ一覧または詳細の表示 */}
            {selectedGenre === "blogs" && !selectedBlog && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs md:text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📖</span> おすすめ観光地紹介ブログ（多言語・SEO対応）
                  </h2>
                  <span className="text-xs text-slate-500">{blogs.length} 記事</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {blogs.map((blog) => (
                    <div
                      key={blog.id}
                      onClick={() => setSelectedBlog(blog)}
                      className="group p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition flex flex-col sm:flex-row gap-4 items-center shadow-lg"
                    >
                      <img
                        src={blog.thumbnail_url}
                        alt={getLocalizedBlogTitle(blog)}
                        className="w-full sm:w-36 h-28 object-cover rounded-xl flex-shrink-0 group-hover:scale-102 transition"
                      />
                      <div className="flex-1 min-w-0 space-y-1.5 text-left w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                            {blog.area}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(blog.created_at || "").toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-amber-300 transition leading-snug">
                          {getLocalizedBlogTitle(blog)}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {getLocalizedBlogContent(blog).replace(/<[^>]*>?/gm, '')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 📖 ブログ詳細（クリック時に開くブログ風ページ） */}
            {selectedBlog && (
              <div className="p-5 sm:p-8 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                    📍 {selectedBlog.area}
                  </span>
                  <button
                    onClick={() => setSelectedBlog(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700"
                  >
                    ← 一覧に戻る
                  </button>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                  {getLocalizedBlogTitle(selectedBlog)}
                </h1>

                <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[400px]">
                  <img
                    src={selectedBlog.thumbnail_url}
                    alt={getLocalizedBlogTitle(selectedBlog)}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* ブログ本文 */}
                <div 
                  className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: getLocalizedBlogContent(selectedBlog) }}
                />

                {/* 出典・参照情報 */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
                  <div>
                    <span>参考・出典: </span>
                    <a href={selectedBlog.source_url} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300 font-bold">
                      {selectedBlog.source_name || "HOKKAIDO CLIPS"}
                    </a>
                  </div>
                  <div>公開日: {new Date(selectedBlog.created_at || "").toLocaleDateString()}</div>
                </div>
              </div>
            )}

            {/* 通常の動画一覧（ブログ表示中以外） */}
            {selectedGenre !== "blogs" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {searchKeyword ? `🔍 検索結果 (${filteredSpots.length}件)` : "🔥 ホット＆新着トレンド動画"}
                  </h2>
                  <span className="text-xs text-slate-500">{filteredSpots.length} 件</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {displayedSpots.map((spot, idx) => {
                    const isBookmarked = bookmarkedIds.includes(spot.id);
                    return (
                      <div
                        key={spot.id}
                        onClick={() => handleSelectSpot(spot)}
                        className={`group relative rounded-xl overflow-hidden bg-slate-900 border aspect-[9/16] cursor-pointer shadow transition ${
                          activeSpot?.id === spot.id ? "ring-2 ring-teal-400 border-transparent" : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <img src={spot.video_thumb} alt={spot.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

                        <div className="absolute top-2 left-2">
                          <span className="w-5 h-5 rounded-full bg-slate-950/80 border border-teal-500/40 text-teal-300 font-extrabold text-[9px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                        </div>

                        <button
                          onClick={(e) => toggleBookmark(spot.id, e)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/60 text-slate-300 border border-white/20"
                        >
                          <span className="text-xs">{isBookmarked ? "❤️" : "🤍"}</span>
                        </button>

                        <div className="absolute bottom-0 inset-x-0 p-2.5">
                          <p className="text-[10px] text-teal-400 font-medium truncate">{spot.area}</p>
                          <h3 className="font-bold text-[11px] text-white leading-tight truncate mt-0.5">{spot.title}</h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 右側パネル（動画プレイヤーやAIツアープラン） */}
          <div className="w-full lg:w-[420px] space-y-5 flex-shrink-0">
            {activeSpot && selectedGenre !== "blogs" && (
              <div ref={activeVideoCardRef} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                <div className="relative aspect-video bg-black">
                  <MultiVideoPlayer key={activeSpot.id} spot={activeSpot} />
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs text-teal-400 font-medium">{activeSpot.area}</span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{activeSpot.title}</h3>
                    </div>

                    <button
                      onClick={() => toggleBookmark(activeSpot.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 flex-shrink-0 ${
                        bookmarkedIds.includes(activeSpot.id)
                          ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                      }`}
                    >
                      <span>{bookmarkedIds.includes(activeSpot.id) ? "❤️" : "🤍"}</span>
                      <span>{bookmarkedIds.includes(activeSpot.id) ? "マーク中" : "マークする"}</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-1">AIスポット解説</h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                      {activeSpot.ai_summary}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

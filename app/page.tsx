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

function getDynamicSmartPhoto(post: BlogPost): string {
  if (post.thumbnail_url && post.thumbnail_url.startsWith("http")) {
    return post.thumbnail_url;
  }
  return "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80";
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
    ai_summary: "普段のスニーカーやブーツの靴底にゴムでワンタッチ装着できる滑り止めスパイク。札幌・小樽の転倒防止に必須。",
    best_time: "11月〜4月の旅行前",
    map_query: "北海道 札幌市",
    souvenirs: [
      {
        name: "携帯用 スノースパイク 靴底滑り止め",
        description: "凍結路面も安心して歩ける携帯用アイゼン。コンパクトに収納可能。",
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
  if (q.includes("クロスホテル")) return "クロスホテル札幌 札幌市中央区北2条西2丁目23";
  if (q.includes("松尾ジンギスカン")) return "松尾ジンギスカン 札幌南1条店";
  if (q.includes("だるま")) return "成吉思汗だるま 本店 札幌市中央区南5条西4丁目";
  if (q.includes("ふくろう亭")) return "ふくろう亭 札幌市中央区南8条西5丁目";
  if (q.includes("ラマイ")) return "アジアンバーラマイ 札幌中央店 札幌市中央区南4条西10丁目";
  if (q.includes("GARAKU") || q.includes("ガラク")) return "スープカレーGARAKU 札幌本店 札幌市中央区南2条西2丁目";
  if (q.includes("Suage") || q.includes("すあげ")) return "Suage+ 本店 札幌市中央区南4条西5丁目";
  if (q.includes("奥芝商店")) return "奥芝商店 駅前創成寺 札幌市中央区北4条西5丁目";
  if (q.includes("ベッセルホテル")) return "ベッセルホテルカンパーナすすきの 札幌市中央区南5条西6丁目";
  if (q.includes("美瑛選果") || q.includes("コーンパン")) return "美瑛選果 新千歳空港店 国内線ターミナル2F";
  if (q.includes("ルタオ") || q.includes("letao")) return "小樽洋菓子舗ルタオ 本店 小樽市堺町7-16";
  if (q.includes("六花亭")) return "六花亭 札幌本店 札幌市中央区北4条西6丁目";
  if (q.includes("信玄")) return "らーめん信玄 南6条店 札幌市中央区南6条西8丁目";
  if (q.includes("一幻")) return "えびそば一幻 総本店 札幌市中央区南7条西9丁目";
  if (q.includes("小樽運河")) return "小樽運河 小樽市港町5";
  if (q.includes("函館山") || q.includes("夜景")) return "函館山ロープウェイ 函館市元町19-7";
  if (q.includes("青い池")) return "白金青い池 北海道上川郡美瑛町白金";
  if (q.includes("旭山動物園")) return "旭川市旭山動物園 旭川市東旭川町倉沼";
  if (q.includes("第一滝本館")) return "登別温泉 第一滝本館 登別市登別温泉町55";
  return `${area} ${title}`.trim();
}

function resolveSpecificSouvenirs(spot: Partial<SpotItem>): SouvenirItem[] {
  const text = `${spot.title || ""} ${spot.ai_summary || ""}`.toLowerCase();
  if (text.includes("白い恋人") || text.includes("ishiya")) {
    return [
      {
        name: "ISHIYA『白い恋人（ホワイト＆ブラック）』",
        description: "北海道土産の最高峰。香ばしいラングドシャで特製ホワイトチョコレートをサンド。",
        image_url: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=80",
        amazon_keyword: "白い恋人 石屋製菓",
        rakuten_keyword: "白い恋人 石屋製菓",
      }
    ];
  }
  if (text.includes("スープカレー") || text.includes("garaku") || text.includes("suage") || text.includes("奥芝商店") || text.includes("ラマイ") || text.includes("カレー")) {
    return [
      {
        name: "名店監修『本格お土産用 レトルト スープカレーBOX』",
        description: "行列店の秘伝スパイスと柔らかチキンを自宅でそのまま味わえる名物セット。",
        image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80",
        amazon_keyword: "札幌 スープカレー レトルト 有名店",
        rakuten_keyword: "札幌 スープカレー レトルト 有名店",
      }
    ];
  }
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
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<Genre | "bookmarks">("all");
  const [selectedRegion, setSelectedRegion] = useState<AreaRegion>("central");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeSpot, setActiveSpot] = useState<SpotItem | null>(null);
  const [stayDuration, setStayDuration] = useState("4");
  const [generatedPlan, setGeneratedPlan] = useState<SpotItem[] | null>(null);
  const [startFromCurrentLocation, setStartFromCurrentLocation] = useState(true);

  // ★ 選択中の個別ブログ記事（これがある時はトップ全体が「フルページの個別記事ビュー」に切り替わる）
  const [activeDetailPagePost, setActiveDetailPagePost] = useState<BlogPost | null>(null);

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
      if (savedLang) {
        setCurrentLang(savedLang);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hk_bookmarks");
      if (saved) {
        setBookmarkedIds(JSON.parse(saved));
      }
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
    if (currentLang === "ko") return post.タイトル_ko || post.title_ko || post.タイトル_ja || post.title_ja || "무제 리포트";
    if (currentLang === "en") return post.タイトル_en || post.title_en || post.タイトル_ja || post.title_ja || "Hokkaido Travel Report";
    return post.タイトル_ja || post.title_ja || post.title || "無題のレポート";
  };

  const fetchSpotsAndBlogs = async () => {
    try {
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

      let blogData: any[] | null = null;
      let res1 = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (res1.data && res1.data.length > 0) {
        blogData = res1.data;
      } else {
        let res2 = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
        if (res2.data && res2.data.length > 0) {
          blogData = res2.data;
        }
      }

      if (blogData && blogData.length > 0) {
        setBlogPosts(blogData);
      } else {
        setBlogPosts([]);
      }
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
      return list
        .map((spot) => {
          let score = 0;
          const titleLower = (spot.title || "").toLowerCase();
          for (const kw of targetKeywords) {
            if (titleLower.includes(kw.toLowerCase())) score += 100;
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

  const startGeneratingWithAd = (isFromBookmarks = false) => {
    setIsGeneratingModalOpen(true);
    setGenerationProgress(0);
    setIsAdCompleted(false);

    let plan: SpotItem[] = [];
    const regionSpots = spots.filter(s => s.region === selectedRegion && s.genre !== "travel_gear");
    const pool = regionSpots.length >= 3 ? regionSpots : spots.filter(s => s.genre !== "travel_gear");

    const foods = pool.filter(s => s.genre === "food");
    const souvenirs = pool.filter(s => s.genre === "souvenir");
    const sights = pool.filter(s => s.genre === "spot" || s.genre === "stay");
    const nights = pool.filter(s => s.genre === "night");

    if (stayDuration === "2") {
      plan = [foods[0] || pool[0], souvenirs[0] || pool[1] || pool[0]].filter(Boolean);
    } else if (stayDuration === "夜だけ") {
      plan = [foods[0] || pool[0], nights[0] || pool[1] || pool[0], souvenirs[0] || pool[2] || pool[0]].filter(Boolean);
    } else {
      plan = [
        foods[0] || pool[0],
        sights[0] || pool[1] || pool[0],
        souvenirs[0] || pool[2] || pool[0],
        nights[0] || pool[3] || pool[0],
      ].filter(Boolean);
    }

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

  const handleFinishAndShowTour = () => {
    setIsGeneratingModalOpen(false);
    setTimeout(() => {
      if (planSectionRef.current) {
        planSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  };

  const getGoogleMapsRouteUrl = (plan: SpotItem[]) => {
    if (!plan || plan.length === 0) return "#";
    const start = startFromCurrentLocation ? "現在地" : (plan[0].map_query || plan[0].title);
    const destination = plan[plan.length - 1].map_query || plan[plan.length - 1].title;
    const waypoints = (startFromCurrentLocation ? plan.slice(0, -1) : plan.slice(1, -1))
      .map(p => encodeURIComponent(p.map_query || p.title))
      .join("|");
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${waypoints}` : ""}&travelmode=driving&dirflg=d`;
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

  // =========================================================================
  // ★ 個別記事ビュー（ポップアップではなく、画面全体が記事ページに切り替わります）
  // =========================================================================
  if (activeDetailPagePost) {
    const postTitle = getLocalizedTitle(activeDetailPagePost);
    const postContent = activeDetailPagePost.コンテンツ_ja || activeDetailPagePost.content_ja || activeDetailPagePost.content || activeDetailPagePost.summary || "";
    const postThumb = getDynamicSmartPhoto(activeDetailPagePost);

    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100">
        <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 shadow-xl">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button 
              onClick={() => {
                setActiveDetailPagePost(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-teal-400 hover:text-teal-300 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition bg-slate-900 border border-teal-500/30 px-3 py-1.5 rounded-xl"
            >
              <span>←</span> <span>トップページ（一覧）に戻る</span>
            </button>
            <span className="text-[11px] text-slate-500 font-bold">HOKKAIDO CLIPS BLOG</span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
                📍 {activeDetailPagePost.area || "北海道"}
              </span>
              <span className="text-xs text-slate-400">
                {activeDetailPagePost.created_at ? new Date(activeDetailPagePost.created_at).toLocaleDateString() : ""}
              </span>
            </div>
            <h1 className="text-xl md:text-3xl font-black text-white leading-snug">
              {postTitle}
            </h1>
          </div>

          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            <img src={postThumb} alt={postTitle} className="w-full h-full object-cover" />
          </div>

          <article className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap bg-slate-900/60 border border-slate-800/80 p-6 md:p-8 rounded-2xl">
            {postContent}
          </article>

          <div className="pt-6 border-t border-slate-800 flex justify-center">
            <button
              onClick={() => {
                setActiveDetailPagePost(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-lg transition"
            >
              ← 観光地・動画一覧に戻る
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentRegionInfo = REGION_MAP.find(r => r.id === selectedRegion);

  // =========================================================================
  // 通常のトップページ全体表示（全コンテンツ・全機能を完全に維持）
  // =========================================================================
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 pb-20">
      
      {/* ブランドヘッダー */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 md:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 group cursor-pointer" onClick={() => { setSelectedGenre("all"); setShowBlogSection(false); setSearchKeyword(""); }}>
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
                  <span>ショート動画</span> <span className="text-teal-400">×</span> <span>AIトラベルコンシェルジュ</span>
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
              <option value="ko">🇰🇷 한국어</option>
              <option value="en">🇺🇸 English</option>
            </select>

            <button 
              onClick={() => startGeneratingWithAd(false)}
              className="text-[11px] sm:text-xs bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 text-white font-extrabold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-lg flex items-center gap-1 whitespace-nowrap"
            >
              <span>🤖</span> <span>AIツアー作成</span>
            </button>
          </div>
        </div>
      </header>

      {/* メインの全体コンテナ */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* 【リッチバナー】北海道人気観光地紹介！ */}
        <section className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-900 text-white p-6 md:p-12 border border-teal-500/30">
          <div className="absolute inset-0 z-0 flex">
            <div className="w-1/2 h-full relative">
              <img 
                src="https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=1000&auto=format&fit=crop&q=80" 
                alt="すすきの夜景・札幌の街並み" 
                className="w-full h-full object-cover filter brightness-75"
              />
            </div>
            <div className="w-1/2 h-full relative">
              <img 
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80" 
                alt="北海道の大自然・山岳風景" 
                className="w-full h-full object-cover filter brightness-75"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40 z-10" />
          </div>

          <div className="relative z-20 max-w-2xl">
            <span className="bg-teal-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Featured Content
            </span>
            <h2 className="text-2xl md:text-4xl font-black mt-3 mb-3 leading-tight text-white drop-shadow-md">
              北海道人気観光地紹介！
            </h2>
            <p className="text-slate-200 text-xs md:text-sm mb-6 leading-relaxed drop-shadow">
              大自然、絶品グルメ、温泉、ロマンチックな夜景など、北海道の秘められた魅力や最新のスポット情報を毎日お届けします。旅の計画や詳細レポートをご覧ください！
            </p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => {
                  setShowBlogSection(true);
                  setTimeout(() => {
                    if (blogSectionRef.current) {
                      blogSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }, 100);
                }}
                className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold px-5 py-3 rounded-xl shadow-lg transition duration-200 text-xs flex items-center gap-1.5"
              >
                <span>📖</span> 観光ブログ記事一覧を見る ({blogPosts.length}件)
              </button>
              <a 
                href="#concierge" 
                className="bg-slate-900/80 hover:bg-slate-900 text-teal-300 border border-teal-500/50 font-bold px-5 py-3 rounded-xl transition duration-200 text-xs backdrop-blur-sm"
              >
                AIコンシェルジュに相談する
              </a>
            </div>
          </div>
        </section>

        {/* ブログ記事一覧エリア（クリックでフルページビューに切り替え） */}
        {showBlogSection && (
          <div ref={blogSectionRef} className="space-y-4 no-print bg-slate-900/95 border border-teal-500/40 p-5 md:p-6 rounded-2xl shadow-xl">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm md:text-base font-extrabold text-white flex items-center gap-2">
                  <span>📖</span> 北海道人気観光地紹介！ブログ＆レポート一覧
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">新着順表示（全 {filteredBlogPosts.length} 件）</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    value={blogSearchQuery}
                    onChange={(e) => {
                      setBlogSearchQuery(e.target.value);
                      setVisibleBlogCount(10);
                    }}
                    placeholder="観光地・キーワードで検索..."
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-teal-400 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none w-48 sm:w-60"
                  />
                </div>

                <button
                  onClick={() => setShowBlogSection(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition flex-shrink-0"
                >
                  ✕ 閉じる
                </button>
              </div>
            </div>

            {displayedBlogPosts.length > 0 ? (
              <div className="space-y-3">
                {displayedBlogPosts.map((post) => {
                  const smartPhoto = getDynamicSmartPhoto(post);
                  const title = getLocalizedTitle(post);

                  return (
                    <div 
                      key={post.id} 
                      onClick={() => {
                        setActiveDetailPagePost(post);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="group bg-slate-950 border border-slate-800 hover:border-teal-500/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition cursor-pointer shadow-md hover:bg-slate-900/80"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-20 h-16 sm:w-24 sm:h-16 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-800">
                          <img 
                            src={smartPhoto} 
                            alt={title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
                              {post.area || "北海道全般"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
                            </span>
                          </div>
                          <h3 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-teal-300 transition">
                            {title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex-shrink-0 self-end sm:self-center">
                        <span className="px-3 py-1.5 rounded-lg bg-teal-500/10 group-hover:bg-teal-500 text-teal-300 group-hover:text-slate-950 font-extrabold text-xs transition flex items-center gap-1 border border-teal-500/30">
                          <span>詳細を読む</span> <span>➔</span>
                        </span>
                      </div>
                    </div>
                  );
                })}

                {visibleBlogCount < filteredBlogPosts.length && (
                  <div className="pt-3 text-center">
                    <button
                      onClick={() => setVisibleBlogCount((prev) => prev + 10)}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl border border-teal-500/30 shadow transition"
                    >
                      もっと見る （残り {filteredBlogPosts.length - visibleBlogCount} 件） ↓
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-10">
                該当するブログ記事が見つかりませんでした。
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <div className="w-full lg:flex-1 space-y-6">
            
            <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-center shadow-xl overflow-hidden no-print">
              <p className="text-[9px] text-slate-500 mb-1 uppercase tracking-widest">スポンサーリンク</p>
              <div className="flex justify-center items-center overflow-hidden max-h-[90px]">
                <ins
                  className="adsbygoogle"
                  style={{ display: "block", width: "100%", maxHeight: "80px" }}
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

            <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 no-print">
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm">🔍</span>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    if (e.target.value) setSelectedGenre("all");
                  }}
                  placeholder="DB全体から検索（ジンギスカン、スープカレー、ラーメン、ホテル等）..."
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
                      else { setSelectedGenre("all"); setSearchKeyword(tag); }
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 no-print">
              {[
                { id: "all", label: "🔥 全て (注目)" },
                { id: "bookmarks", label: `❤️ マーク済み (${bookmarkedIds.length})` },
                { id: "food", label: "🍜 グルメ (厳選TOP)" },
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
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedGenre === tab.id && !searchKeyword
                      ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {generatedPlan && (
              <div ref={planSectionRef} className="p-5 md:p-6 bg-slate-900/95 rounded-2xl border border-teal-500/50 shadow-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      {currentRegionInfo?.label}（{currentRegionInfo?.sub}）
                    </span>
                    <h3 className="text-base md:text-xl font-extrabold text-white flex items-center gap-2 mt-1">
                      <span>🚗</span> 現在地からの最適周遊ルート
                    </h3>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <a
                      href={getGoogleMapsRouteUrl(generatedPlan)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
                    >
                      <span>🗺️</span> Googleマップナビ開始
                    </a>
                    <button 
                      onClick={() => setGeneratedPlan(null)} 
                      className="px-3 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
                    >
                      閉じる
                    </button>
                  </div>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-500/40">
                  {generatedPlan.map((spot) => (
                    <div key={spot.id} onClick={() => handleSelectSpot(spot)} className="p-4 rounded-xl border bg-slate-900 border-slate-800 cursor-pointer flex gap-4">
                      <img src={spot.video_thumb} alt={spot.title} className="w-16 h-20 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300">{spot.area}</span>
                        <h4 className="font-bold text-xs md:text-sm text-white truncate mt-1">{spot.title}</h4>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{spot.ai_summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div id="spots" className="no-print">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">
                  {searchKeyword ? `🔍 検索結果 (${filteredSpots.length}件)` : "🔥 おすすめ動画"}
                </h2>
                <span className="text-xs text-slate-500">DB総数: {spots.length} 件</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {displayedSpots.map((spot, idx) => (
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
                      <span className="text-xs">{bookmarkedIds.includes(spot.id) ? "❤️" : "🤍"}</span>
                    </button>
                    <div className="absolute bottom-0 inset-x-0 p-2.5">
                      <p className="text-[10px] text-teal-400 font-medium truncate">{spot.area}</p>
                      <h3 className="font-bold text-[11px] text-white leading-tight truncate mt-0.5">{spot.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右側パネル */}
          <div className="w-full lg:w-[420px] space-y-5 flex-shrink-0 no-print">
            <div id="concierge" className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                  <span>🤖</span> AIトラベルコンシェルジュ
                </h3>
                <p className="text-xs text-slate-400 mt-1">エリアと滞在時間を選ぶだけで、無理のない最適周遊ルートを作成します。</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-2 block">1. エリア選択</label>
                <div className="grid grid-cols-2 gap-2">
                  {REGION_MAP.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRegion(r.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedRegion === r.id
                          ? "bg-teal-500 text-white border-teal-400 shadow-md shadow-teal-500/20"
                          : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <div className="font-extrabold text-xs">{r.label}</div>
                      <div className={`text-[10px] truncate ${selectedRegion === r.id ? "text-teal-100" : "text-slate-400"}`}>
                        {r.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => startGeneratingWithAd(false)}
                disabled={spots.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition"
              >
                <span>🚀</span> <span>周遊ツアールートを自動生成</span>
              </button>
            </div>

            {activeSpot && (
              <div ref={activeVideoCardRef} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                <div className="relative aspect-video bg-black">
                  <MultiVideoPlayer key={activeSpot.id} spot={activeSpot} />
                </div>
                <div className="p-5 space-y-4">
                  <h3 className="text-lg font-bold text-white">{activeSpot.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    {activeSpot.ai_summary}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AIツアー生成モーダル */}
      {isGeneratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-teal-400/60 rounded-3xl p-6 max-w-lg w-full space-y-6">
            <div className="text-center space-y-3">
              <div className="text-teal-300 text-xs font-black">
                {isAdCompleted ? "AIツアールート計算完了！" : "AIが最適周遊ルートを計算中..."}
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div className="bg-teal-400 h-full transition-all duration-300" style={{ width: `${generationProgress}%` }} />
              </div>
            </div>
            {isAdCompleted && (
              <button
                onClick={handleFinishAndShowTour}
                className="w-full py-4 bg-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg"
              >
                ツアールートを見る ➔
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

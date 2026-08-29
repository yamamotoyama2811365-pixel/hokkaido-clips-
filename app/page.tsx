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
  title?: string;
  title_ja?: string;
  content?: string;
  content_ja?: string;
  summary?: string;
  area?: string;
  thumbnail_url?: string;
  created_at?: string;
}

// ==========================================
// 🎯 各観光地に100%合致する厳選された美しい高画質写真マップ（絶対にズレない完全固定版）
// ==========================================
const PERFECT_AREA_PHOTOS: Record<string, string> = {
  "旭川": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80", // 動物・冬景色
  "旭山": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80",
  "定山渓": "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&auto=format&fit=crop&q=80", // 温泉・渓谷
  "温泉": "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&auto=format&fit=crop&q=80",
  "富良野": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80", // 大自然・花畑
  "美瑛": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80", // 大自然・丘
  "函館": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80", // 港町・夜景
  "小樽": "https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=800&auto=format&fit=crop&q=80", // 運河・倉庫街
  "札幌": "https://images.unsplash.com/photo-1546874177-af3118e6e580?w=800&auto=format&fit=crop&q=80", // 札幌・大通公園
  "大通": "https://images.unsplash.com/photo-1546874177-af3118e6e580?w=800&auto=format&fit=crop&q=80",
};

function getGuaranteedPhoto(post: BlogPost): string {
  const text = `${post.area || ""} ${post.title_ja || ""} ${post.title || ""}`;

  // 記事のエリアやタイトルに含まれるキーワードを優先的にチェックして正しい写真を返す
  for (const [keyword, photoUrl] of Object.entries(PERFECT_AREA_PHOTOS)) {
    if (text.includes(keyword)) {
      return photoUrl;
    }
  }

  // データベースに純粋なURLが綺麗に入っている場合のみそれを使用
  const raw = post.thumbnail_url || "";
  if (raw.startsWith("http") && !raw.includes("[") && !raw.includes("(") && !raw.includes("写真")) {
    return raw;
  }

  // デフォルトの北海道の美しい風景
  return "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&auto=format&fit=crop&q=80";
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

  if (text.includes("ジンギスカン") || text.includes("だるま") || text.includes("松尾") || text.includes("ラム") || text.includes("ビール園") || text.includes("ふくろう亭")) {
    return [
      {
        name: "名店特製『味付極上ラム肉ギフトセット（特製タレ付）』",
        description: "厳選ラム肉と秘伝タレをクール便パック。自宅で本格ジンギスカンを楽しめる人気ギフト。",
        image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80",
        amazon_keyword: "松尾ジンギスカン 味付ラム",
        rakuten_keyword: "松尾ジンギスカン 味付ラム",
      }
    ];
  }

  if (text.includes("一幻") || text.includes("信玄") || text.includes("ラーメン") || text.includes("らーめん")) {
    return [
      {
        name: "銘店公認『お土産生ラーメンBOX（特製スープ付）』",
        description: "行列店のコク深いスープと熟成ちぢれ麺をそのまま再現できる名物セット。",
        image_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80",
        amazon_keyword: "えびそば一幻 ラーメン お土産",
        rakuten_keyword: "えびそば一幻 ラーメン お土産",
      }
    ];
  }

  if (text.includes("letao") || text.includes("ルタオ")) {
    return [
      {
        name: "ルタオ『ドゥーブルフロマージュ』",
        description: "口の中でとろける2層仕立ての極上チーズケーキ。北海道を代表する完売必至スイーツ。",
        image_url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80",
        amazon_keyword: "ルタオ ドゥーブルフロマージュ",
        rakuten_keyword: "ルタオ ドゥーブルフロマージュ",
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

  const [showBlogSection, setShowBlogSection] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);

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
      if (!savedLang && typeof navigator !== "undefined") {
        const browserLang = (navigator.language || (navigator.languages && navigator.languages[0]) || "").toLowerCase();
        let targetLang = "ja";

        if (browserLang.startsWith("en")) targetLang = "en";
        else if (browserLang.includes("tw") || browserLang.includes("hk")) targetLang = "zh-TW";
        else if (browserLang.startsWith("zh")) targetLang = "zh-CN";
        else if (browserLang.startsWith("ko")) targetLang = "ko";

        if (targetLang !== "ja") {
          setCurrentLang(targetLang);
          document.cookie = `googtrans=/ja/${targetLang}; path=/;`;
          document.cookie = `googtrans=/ja/${targetLang}; domain=.${window.location.hostname}; path=/;`;
          localStorage.setItem("hk_lang_pref", targetLang);
        }
      } else if (savedLang) {
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

    if (langCode === "ja") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=." + window.location.hostname + "; path=/;";
      window.location.reload();
      return;
    }

    const selectEl = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (selectEl) {
      selectEl.value = langCode;
      selectEl.dispatchEvent(new Event("change"));
    } else {
      document.cookie = `googtrans=/ja/${langCode}; path=/;`;
      document.cookie = `googtrans=/ja/${langCode}; domain=.${window.location.hostname}; path=/;`;
      window.location.reload();
    }
  };

  const fetchSpotsAndBlogs = async () => {
    try {
      const { data: spotData } = await supabase
        .from("spots")
        .select("*")
        .order("created_at", { ascending: false });

      const rawList = spotData && spotData.length > 0 ? spotData : [];
      
      const cleanList = rawList.map((s: any) => {
        return {
          ...s,
          video_id: s.video_id,
          video_type: "youtube" as VideoPlatform,
          map_query: cleanMapQuery(s.title, s.area),
          region: detectRegion(s),
          souvenirs: resolveSpecificSouvenirs(s),
        };
      });

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

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "ja",
          includedLanguages: "en,zh-TW,zh-CN,ko,ja",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };
  }, []);

  const filteredBlogPosts = useMemo(() => {
    if (!blogSearchQuery.trim()) return blogPosts;
    const q = blogSearchQuery.toLowerCase().trim();
    return blogPosts.filter((post) => {
      const title = (post.title_ja || post.title || "").toLowerCase();
      const area = (post.area || "").toLowerCase();
      const content = (post.content_ja || post.content || "").toLowerCase();
      return title.includes(q) || area.includes(q) || content.includes(q);
    });
  }, [blogPosts, blogSearchQuery]);

  const displayedBlogPosts = filteredBlogPosts.slice(0, visibleBlogCount);

  const bookmarkedSpots = useMemo(() => {
    return spots.filter((s) => bookmarkedIds.includes(s.id));
  }, [spots, bookmarkedIds]);

  const filteredSpots = useMemo(() => {
    let list = spots;

    if (searchKeyword.trim()) {
      const rawQ = searchKeyword.toLowerCase().trim();
      const targetKeywords = SYNONYM_MAP[searchKeyword] || [rawQ];

      const scoredList = list
        .map((spot) => {
          let score = 0;
          const titleLower = (spot.title || "").toLowerCase();
          const summaryLower = (spot.ai_summary || "").toLowerCase();
          const areaLower = (spot.area || "").toLowerCase();
          const genreLower = (spot.genre || "").toLowerCase();

          for (const kw of targetKeywords) {
            const kwL = kw.toLowerCase();
            if (titleLower.includes(kwL)) score += 100;
            if (summaryLower.includes(kwL)) score += 40;
            if (areaLower.includes(kwL)) score += 30;
            if (genreLower.includes(kwL)) score += 20;
          }
          return { spot, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.spot);

      return scoredList;
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

  const handleTagClick = (tag: string) => {
    if (searchKeyword === tag) {
      setSearchKeyword("");
    } else {
      setSelectedGenre("all");
      setSearchKeyword(tag);
    }
  };

  const startGeneratingWithAd = (isFromBookmarks = false) => {
    setIsGeneratingModalOpen(true);
    setGenerationProgress(0);
    setIsAdCompleted(false);

    let plan: SpotItem[] = [];

    if (isFromBookmarks) {
      const foods = bookmarkedSpots.filter((s) => s.genre === "food");
      const sights = bookmarkedSpots.filter((s) => s.genre === "spot" || s.genre === "stay");
      const souvenirs = bookmarkedSpots.filter((s) => s.genre === "souvenir");
      const nights = bookmarkedSpots.filter((s) => s.genre === "night");
      const others = bookmarkedSpots.filter(
        (s) => !foods.includes(s) && !sights.includes(s) && !souvenirs.includes(s) && !nights.includes(s)
      );
      plan = [...foods, ...sights, ...souvenirs, ...nights, ...others];
    } else {
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

  const handleSaveTourPDF = () => {
    window.print();
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

  const currentRegionInfo = REGION_MAP.find(r => r.id === selectedRegion);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 pb-20">
      
      <style jsx global>{`
        @media print {
          body { background-color: #fff !important; color: #000 !important; }
          header, #google_translate_element, .no-print, .fixed, input, select, button:not(.print-include) { display: none !important; }
          .print-area { display: block !important; border: 1px solid #ccc !important; background: #fff !important; color: #000 !important; padding: 0 !important; }
          .print-area * { color: #000 !important; border-color: #ddd !important; background: transparent !important; }
        }
      `}</style>

      <Script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
      <div id="google_translate_element" className="hidden" />

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
              <option value="en">🇺🇸 English</option>
              <option value="zh-TW">🇹🇼 繁體中文</option>
              <option value="zh-CN">🇨🇳 简体中文</option>
              <option value="ko">🇰🇷 한국어</option>
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

        {/* =========================================================
         * 【リッチバナー】北海道人気観光地紹介！
         * ========================================================= */}
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

        {/* 独立したブログ記事一覧表示エリア */}
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
                  const guaranteedPhoto = getGuaranteedPhoto(post);
                  return (
                    <div 
                      key={post.id} 
                      onClick={() => setSelectedBlogPost(post)}
                      className="group bg-slate-950 border border-slate-800 hover:border-teal-500/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition cursor-pointer shadow-md hover:bg-slate-900/80"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-20 h-16 sm:w-24 sm:h-16 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-800">
                          <img 
                            src={guaranteedPhoto} 
                            alt={post.title_ja || post.title || "北海道観光"} 
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
                            {post.title_ja || post.title || "無題のレポート"}
                          </h3>
                        </div>
                      </div>

                      <div className="flex-shrink-0 self-end sm:self-center">
                        <span className="px-3 py-1.5 rounded-lg bg-teal-500/10 group-hover:bg-teal-500 text-teal-300 group-hover:text-slate-950 font-extrabold text-xs transition flex items-center gap-1 border border-teal-500/30">
                          <span>詳細を見る</span> <span>➔</span>
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

        {/* 記事詳細ポップアップ（モーダル） */}
        {selectedBlogPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print">
            <div className="bg-slate-900 border border-teal-500/50 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-5">
              <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded font-bold">
                    📍 {selectedBlogPost.area || "北海道全般"}
                  </span>
                  <h2 className="text-base md:text-xl font-black text-white mt-2 leading-snug">
                    {selectedBlogPost.title_ja || selectedBlogPost.title}
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {selectedBlogPost.created_at ? new Date(selectedBlogPost.created_at).toLocaleDateString() : ""} 公開
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBlogPost(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold transition flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden h-56 w-full bg-slate-950 border border-slate-800">
                <img 
                  src={getGuaranteedPhoto(selectedBlogPost)} 
                  alt="サムネイル" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-xs md:text-sm text-slate-200 leading-relaxed space-y-3 pt-2">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: selectedBlogPost.content_ja || selectedBlogPost.content || "本文がありません。" 
                  }} 
                  className="prose prose-invert max-w-none text-xs md:text-sm leading-relaxed [&>h2]:text-teal-300 [&>h2]:text-base [&>h2]:font-bold [&>h2]:mt-4 [&>h2]:mb-2 [&>p]:mb-3"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedBlogPost(null)}
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition"
                >
                  閉じる
                </button>
              </div>
            </div>
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
                    onClick={() => handleTagClick(tag)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {selectedGenre === "night" && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-pink-950/90 border border-purple-500/50 shadow-xl space-y-2 no-print">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌙</span>
                    <span className="text-xs font-black text-purple-200 tracking-wider">すすきのナイト＆エンタメ総合ガイド（キャバクラ・スナック・音楽クラブ）</span>
                  </div>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded">PR / 20歳以上</span>
                </div>
                <p className="text-xs text-slate-300">
                  すすきのの人気キャバクラ、ニュークラブ、スナック、そして音楽で朝まで盛り上がるナイトクラブ（DJイベント等）のリアルなSNS動画をピックアップ！
                </p>
              </div>
            )}

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
                      ? tab.id === "night"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-102"
                        : "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {generatedPlan && (
              <div ref={planSectionRef} className="print-area p-5 md:p-6 bg-slate-900/95 rounded-2xl border border-teal-500/50 shadow-2xl space-y-5 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        {currentRegionInfo?.label}（{currentRegionInfo?.sub}）
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        {stayDuration === "夜だけ" ? "ナイトコース" : `${stayDuration}時間ツアー`}
                      </span>
                    </div>
                    <h3 className="text-base md:text-xl font-extrabold text-white flex items-center gap-2 mt-1">
                      <span>🚗</span> 現在地からの最適周遊ルート
                    </h3>
                  </div>

                  <div className="flex items-center flex-wrap gap-2.5 no-print">
                    <a
                      href={getGoogleMapsRouteUrl(generatedPlan)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
                    >
                      <span>🗺️</span> Googleマップナビ開始
                    </a>

                    <button
                      onClick={handleSaveTourPDF}
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <span>📄</span> ツアーをPDF保存
                    </button>

                    <button 
                      onClick={() => setGeneratedPlan(null)} 
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition"
                    >
                      <span>✕</span> 閉じる
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center overflow-x-auto gap-2 text-xs">
                  <span className="font-bold text-teal-400 whitespace-nowrap bg-teal-950 px-2.5 py-1 rounded-md border border-teal-500/40">
                    📍 {startFromCurrentLocation ? "現在地" : "出発地"}
                  </span>
                  <span className="text-slate-500">➔</span>
                  {generatedPlan.map((s, idx) => (
                    <React.Fragment key={idx}>
                      <span className="font-bold text-teal-300 whitespace-nowrap bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-500/30">
                        {idx + 1}. {s.title.slice(0, 12)}...
                      </span>
                      {idx < generatedPlan.length - 1 && <span className="text-slate-500">➔</span>}
                    </React.Fragment>
                  ))}
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-500/40">
                  {generatedPlan.map((spot, idx) => (
                    <div key={spot.id} className="relative">
                      <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-teal-400 ring-4 ring-slate-950" />
                      
                      <div className="text-xs font-bold text-teal-400 mb-1.5 flex items-center gap-2">
                        <span>
                          {idx === 0 && "① 立ち寄り先（グルメ・食事）"}
                          {idx === 1 && "② 立ち寄り先（宿泊 / 観光）"}
                          {idx === 2 && "③ 立ち寄り先（★限定お土産ショッピング）"}
                          {idx === 3 && "④ 立ち寄り先（ナイト・シメ）"}
                        </span>
                      </div>

                      <div 
                        onClick={() => handleSelectSpot(spot)}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                          activeSpot?.id === spot.id 
                            ? "bg-slate-800/95 border-teal-400 shadow-lg ring-1 ring-teal-400" 
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex gap-4">
                          <img src={spot.video_thumb} alt={spot.title} className="w-16 h-20 md:w-20 md:h-24 object-cover rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
                                {spot.area}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">{spot.best_time}</span>
                            </div>
                            <h4 className="font-bold text-xs md:text-sm text-white truncate mt-1">{spot.title}</h4>
                            <p className="text-xs text-slate-400 font-medium">📍 {spot.map_query}</p>
                            <p className="text-xs text-slate-300 mt-1 line-clamp-2">{spot.ai_summary}</p>
                          </div>
                        </div>

                        {spot.souvenirs && spot.souvenirs.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-800 bg-amber-950/25 border border-amber-500/25 p-3 rounded-xl">
                            <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5 mb-2">
                              <span>🎁</span> ここで買うべきマストバイ:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {spot.souvenirs.map((item, sIdx) => (
                                <div key={sIdx} className="flex flex-col gap-2 bg-slate-900/80 border border-amber-500/20 p-2.5 rounded-lg">
                                  <div className="flex gap-2.5 items-center">
                                    {item.image_url && (
                                      <img 
                                        src={item.image_url} 
                                        alt={item.name} 
                                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-amber-400/30"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-amber-100 text-xs truncate">{item.name}</div>
                                      <div className="text-slate-300 text-[10px] line-clamp-2 mt-0.5">{item.description}</div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800 no-print">
                                    <a
                                      href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(item.amazon_keyword || item.name)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 py-1 px-2 rounded-md bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[10px] text-center transition"
                                    >
                                      🛒 Amazonで見る
                                    </a>
                                    <a
                                      href={`https://search.rakuten.co.jp/search/mall/${encodeURIComponent(item.rakuten_keyword || item.name)}/`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 py-1 px-2 rounded-md bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-bold text-[10px] text-center transition"
                                    >
                                      🛍️ 楽天で見る
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div id="spots" className="no-print">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">
                  {searchKeyword ? `🔍 検索結果 (${filteredSpots.length}件)` : selectedGenre === "night" ? "🌙 すすきの ナイト＆エンタメ動画" : selectedGenre === "all" ? "🔥 ホット＆新着トレンド動画 (TOP20)" : `${selectedGenre.toUpperCase()} おすすめ動画`}
                </h2>
                <span className="text-xs text-slate-500">DB総数: {spots.length} 件</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {displayedSpots.map((spot, idx) => {
                  const isBookmarked = bookmarkedIds.includes(spot.id);
                  return (
                    <React.Fragment key={spot.id}>
                      <div
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

                      {selectedGenre === "night" && idx === 1 && (
                        <a
                          href="https://www.nights.ne.jp/hokkaido/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-purple-950 to-pink-950 border border-purple-500/60 aspect-[9/16] cursor-pointer p-3 flex flex-col justify-between shadow-xl"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] bg-purple-400 text-slate-950 font-black px-1.5 py-0.2 rounded">PR</span>
                            <span className="text-[8px] text-purple-200">20歳以上</span>
                          </div>
                          <div className="text-center my-auto space-y-1">
                            <div className="text-2xl">🌙</div>
                            <div className="font-black text-xs text-white leading-tight">すすきの夜遊びガイド</div>
                            <div className="text-[10px] text-purple-200">限定クーポン＆店舗情報</div>
                          </div>
                          <div className="py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-[10px] text-center rounded-lg shadow">
                            詳細を見る ➔
                          </div>
                        </a>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右側パネル */}
          <div className="w-full lg:w-[420px] space-y-5 flex-shrink-0 no-print">
            
            {bookmarkedSpots.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-extrabold text-xs">
                    <span>❤️</span>
                    <span>マークしたお店だけでツアー作成</span>
                  </div>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30 font-bold">
                    {bookmarkedIds.length} 件選択中
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  お気に入りにマークしたお店だけを巡る専用のツアールート＆Googleマップ案内を作成します。
                </p>
                <button
                  onClick={() => startGeneratingWithAd(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <span>📌</span> マークしたスポットでツアールート生成
                </button>
              </div>
            )}

            <div id="concierge" className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                  <span>🤖</span> AIトラベルコンシェルジュ
                </h3>
                <p className="text-xs text-slate-400 mt-1">エリアと滞在時間を選ぶだけで、無理のない最適周遊ルートを作成します。</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-2 block">1. 出発・観光エリアを選択</label>
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

              <div>
                <label className="text-xs font-bold text-slate-300 mb-2 block">2. ツアー滞在時間</label>
                <div className="grid grid-cols-4 gap-2">
                  {["2", "4", "6", "夜だけ"].map((time) => (
                    <button
                      key={time}
                      onClick={() => setStayDuration(time)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        stayDuration === time
                          ? "bg-teal-500 text-white border-teal-400 shadow-md shadow-teal-500/20"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {time === "夜だけ" ? "🌙 夜だけ" : `${time}時間`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="currentLoc"
                  checked={startFromCurrentLocation}
                  onChange={(e) => setStartFromCurrentLocation(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <label htmlFor="currentLoc" className="text-xs text-slate-300 cursor-pointer font-medium">
                  現在地を出発地点にする
                </label>
              </div>

              <button
                onClick={() => startGeneratingWithAd(false)}
                disabled={spots.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
              >
                <span>🚀</span> <span>周遊ツアールートを自動生成</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-xl overflow-hidden max-h-[220px]">
              <p className="text-[9px] text-slate-500 mb-2 uppercase tracking-widest">スポンサーリンク</p>
              <div className="flex justify-center items-center overflow-hidden max-h-[150px]">
                <ins
                  className="adsbygoogle"
                  style={{ display: "block", width: "100%", maxHeight: "140px" }}
                  data-ad-client="ca-pub-5776658615046901"
                  data-ad-slot="6392139179"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                ></ins>
                <Script
                  id="adsbygoogle-sidebar-init"
                  strategy="afterInteractive"
                  dangerouslySetInnerHTML={{
                    __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
                  }}
                />
              </div>
            </div>

            {activeSpot && (
              <div ref={activeVideoCardRef} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl scroll-mt-20">
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

                  <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                    <div className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <span>📊</span> 混雑予測: <span className="text-teal-400">{activeSpot.crowd_text}</span>
                    </div>
                    <p className="text-xs text-slate-400">💡 おすすめ時間帯: {activeSpot.best_time}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-1">
                      {activeSpot.genre === "travel_gear" ? "💡 アイテム活用ポイント" : "AIスポット解説"}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                      {activeSpot.ai_summary}
                    </p>
                  </div>

                  {activeSpot.genre === "stay" && (
                    <div className="pt-1">
                      <a
                        href={`https://search.travel.rakuten.co.jp/ds/hotel/search?f_query=${encodeURIComponent(activeSpot.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
                      >
                        <span>🏨</span> 楽天トラベルで空室・プランを確認
                      </a>
                    </div>
                  )}

                  {activeSpot.souvenirs && activeSpot.souvenirs.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 mb-2">
                        {activeSpot.genre === "travel_gear" ? "🧳 おすすめアイテム（即購入可）" : "🎁 ここで買うべきマストバイ"}
                      </h4>
                      <div className="space-y-2.5">
                        {activeSpot.souvenirs.map((s, idx) => (
                          <div key={idx} className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl space-y-2.5">
                            <div className="flex gap-3 items-center">
                              {s.image_url && (
                                <img 
                                  src={s.image_url} 
                                  alt={s.name} 
                                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-amber-400/30"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-amber-200 text-xs">{s.name}</div>
                                <div className="text-slate-400 text-[11px] line-clamp-2 mt-0.5">{s.description}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                              <a
                                href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(s.amazon_keyword || s.name)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-extrabold text-[11px] text-center transition"
                              >
                                🛒 Amazonで探す
                              </a>
                              <a
                                href={`https://search.rakuten.co.jp/search/mall/${encodeURIComponent(s.rakuten_keyword || s.name)}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-extrabold text-[11px] text-center transition"
                              >
                                🛍️ 楽天市場で探す
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSpot.genre !== "travel_gear" && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeSpot.map_query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs md:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                    >
                      <span>📍</span> 単体スポットの場所をGoogle Mapsで開く
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AIツアー生成中・完了モーダル */}
      {isGeneratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in no-print">
          <div className="bg-slate-900 border border-teal-400/60 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative space-y-6">
            
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                {isAdCompleted ? "AIツアールート計算完了！" : "AIが最適周遊ルートを計算中..."}
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {isAdCompleted ? "全スポットの混雑予測・移動距離の最適化が完了しました。" : "スポット間の移動時間・混雑予測・マストバイお土産データを解析しています..."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center shadow-xl overflow-hidden">
              <p className="text-[9px] text-slate-500 mb-2 uppercase tracking-widest">スポンサーリンク</p>
              <div className="flex justify-center items-center min-h-[120px]">
                <ins
                  className="adsbygoogle"
                  style={{ display: "block", width: "100%" }}
                  data-ad-client="ca-pub-5776658615046901"
                  data-ad-slot="6392139179"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                ></ins>
                <Script
                  id="adsbygoogle-modal-init"
                  strategy="afterInteractive"
                  dangerouslySetInnerHTML={{
                    __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
                  }}
                />
              </div>
            </div>

            <div>
              {isAdCompleted ? (
                <button
                  onClick={handleFinishAndShowTour}
                  className="w-full py-4 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-200 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-[0_4px_30px_rgba(45,212,191,0.6)] transition active:scale-98 flex items-center justify-center gap-2 animate-bounce-short"
                >
                  <span>🎉</span> <span>ツアールートを見る（完成）</span> <span>➔</span>
                </button>
              ) : (
                <div className="w-full py-3.5 bg-slate-800 text-slate-500 font-bold text-xs rounded-2xl text-center flex items-center justify-center gap-2">
                  <span className="animate-spin text-sm">⏳</span> 計算中... しばらくお待ちください ({generationProgress}%)
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

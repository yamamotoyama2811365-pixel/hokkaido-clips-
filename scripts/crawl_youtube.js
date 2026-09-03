const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase環境変数が不足しています。");
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY が渡っていません。");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const FEEDS = [
  { name: "札幌観光協会 旬のたび", url: "https://www.sapporo.travel/feed/" },
  { name: "函館公式観光ガイド", url: "https://www.hakobura.jp/feed/" },
  { name: "北海道公式観光情報", url: "https://www.visit-hokkaido.jp/news/rss" }
];

const PHOTO_BANK = {
  "札幌": "https://images.unsplash.com/photo-1578637387939-43c525550085",
  "函館": "https://images.unsplash.com/photo-1548013146-72479768bada",
  "小樽": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26",
  "富良野": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
  "美瑛": "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "北海道": "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb"
};

// slug用の英字変換テーブル（安全なURLにするため）
const AREA_SLUG_MAP = {
  "札幌": "sapporo",
  "函館": "hakodate",
  "小樽": "otaru",
  "富良野": "furano",
  "美瑛": "biei",
  "旭川": "asahikawa",
  "知床": "shiretoko",
  "登別": "noboribetsu",
  "洞爺湖": "toya",
  "苫小牧": "tomakomai",
  "釧路": "kushiro",
  "帯広": "obihiro",
  "定山渓": "jozankei",
  "北海道": "hokkaido"
};

function detectArea(text) {
  const areas = ['札幌', '函館', '小樽', '富良野', '美瑛', '旭川', '知床', '登別', '洞爺湖', '苫小牧', '釧路', '帯広', '定山渓'];
  for (const a of areas) {
    if (text.includes(a)) return a;
  }
  return '北海道';
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateDeepArticle(rawTitle, rawText, sourceUrl, area) {
  const prompt = `
あなたは北海道専門トラベルメディア「HOKKAIDO CLIPS」のプロライターです。
以下の元記事情報をもとに、著作権侵害にならないよう完全オリジナル構成で読者に役立つ肉厚な旅行ブログ記事（日・英・韓）を執筆してください。

元タイトル: ${rawTitle}
元記事内容: ${rawText}
対象エリア: ${area}
参照URL: ${sourceUrl}

【執筆ルール】
1. title_ja はクリックしたくなる魅力的なSEOタイトルにしてください（30〜35文字）。
2. content_ja は必ず<h2>と<p>を使い、以下の構成で800文字以上の具体的で読み応えのある本文にしてください。
   - <h2>注目の見どころと旬の魅力</h2>
   - <h2>旅行者におすすめの楽しみ方と巡り方</h2>
   - <h2>現地アクセスと基本情報</h2>
3. 英語（en）と韓国語（ko）も同様の品質で作成してください。

【出力フォーマット（有効なJSONのみ出力）】
{
  "title_ja": "...",
  "content_ja": "<h2>...</h2><p>...</p>",
  "title_en": "...",
  "content_en": "<h2>...</h2><p>...</p>",
  "title_ko": "...",
  "content_ko": "<h2>...</h2><p>...</p>"
}
`;

  const models = ["gemini-3.6-flash", "gemini-2.5-flash"];

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await res.json();
      if (data.error) {
        console.warn(`⚠️ モデル ${model} 応答エラー: ${data.error.message}`);
        continue;
      }

      let txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (txt) {
        txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(txt);
      }
    } catch (err) {
      console.warn(`⚠️ モデル ${model} 通信失敗: ${err.message}`);
    }
  }

  console.error("❌ 全てのGeminiモデルでの生成に失敗しました。");
  return null;
}

async function fetchRssItems(feed) {
  try {
    const res = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const xml = await res.text();
    const items = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const raw of itemMatches.slice(0, 3)) {
      const titleMatch = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || raw.match(/<title>(.*?)<\/title>/);
      const linkMatch = raw.match(/<link>(.*?)<\/link>/);
      const descMatch = raw.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || raw.match(/<description>(.*?)<\/description>/);

      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const link = linkMatch ? linkMatch[1].trim() : '';
      const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      if (title && link) {
        items.push({ title, link, desc, sourceName: feed.name });
      }
    }
    return items;
  } catch (e) {
    console.warn(`フィード取得失敗 (${feed.name}):`, e.message);
    return [];
  }
}

async function main() {
  console.log("🚀 北海道観光記事の収集＆自動要約・リライトを開始します...");

  for (const feed of FEEDS) {
    console.log(`📡 フィード確認中: ${feed.name}`);
    const items = await fetchRssItems(feed);

    for (const item of items) {
      const { data: existing } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("source_url", item.link)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️ スキップ（登録済み）: ${item.title}`);
        continue;
      }

      const area = detectArea(`${item.title} ${item.desc}`);
      console.log(`✍️ Gemini執筆開始: [${area}] ${item.title}`);

      const article = await generateDeepArticle(item.title, item.desc, item.link, area);
      if (!article) {
        console.warn(`⚠️ 記事生成不可のためスキップ: ${item.title}`);
        continue;
      }

      // slugを完全英数字にする（例: sapporo-1756948291）
      const areaSlug = AREA_SLUG_MAP[area] || "hokkaido";
      const timestamp = Math.floor(Date.now() / 1000);
      const slug = `${areaSlug}-${timestamp}`;
      const thumb = PHOTO_BANK[area] || PHOTO_BANK["北海道"];

      const { error } = await supabase.from("blog_posts").insert({
        slug: slug,
        area: area,
        title_ja: article.title_ja,
        content_ja: article.content_ja,
        title_en: article.title_en,
        content_en: article.content_en,
        title_ko: article.title_ko,
        content_ko: article.content_ko,
        thumbnail_url: thumb,
        source_name: item.sourceName,
        source_url: item.link
      });

      if (error) {
        console.error("❌ Supabase保存エラー:", error.message);
      } else {
        console.log(`🎉 肉厚ブログ記事を公開しました: ${article.title_ja} (slug: ${slug})`);
      }

      // APIレート制限回避のため3秒待機
      await sleep(3000);
    }
  }

  console.log("🏁 すべての収集・執筆処理が完了しました。");
}

main();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase環境変数が不足しています。");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// 北海道観光の公式・優良フィード一覧（一次ソース）
const FEEDS = [
  { name: "北海道公式観光情報", url: "https://www.visit-hokkaido.jp/news/rss" },
  { name: "札幌観光協会 旬のたび", url: "https://www.sapporo.travel/feed/" },
  { name: "函館公式観光ガイド", url: "https://www.hakobura.jp/feed/" }
];

// 高解像度フリー写真のストック（エリア別フォールバック）
const PHOTO_BANK = {
  "札幌": "https://images.unsplash.com/photo-1578637387939-43c525550085",
  "函館": "https://images.unsplash.com/photo-1548013146-72479768bada",
  "小樽": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26",
  "富良野": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
  "美瑛": "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "北海道": "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb"
};

// エリア自動判別
function detectArea(text) {
  const areas = ['札幌', '函館', '小樽', '富良野', '美瑛', '旭川', '知床', '登別', '洞爺湖', '苫小牧', '釧路', '帯広'];
  for (const a of areas) {
    if (text.includes(a)) return a;
  }
  return '北海道';
}

// GeminiによるSEO長文リライト生成
async function generateDeepArticle(rawTitle, rawText, sourceUrl, area) {
  const prompt = `
あなたは北海道専門トラベルメディア「HOKKAIDO CLIPS」の専属プロライターです。
以下の元記事（事実情報）を読み込み、著作権を侵害しないよう独自の構成・視点で再構築した、読者に有益で肉厚な旅行ブログ記事（日本語・英語・韓国語）を執筆してください。

【元情報】
タイトル: ${rawTitle}
元記事抜粋: ${rawText}
対象エリア: ${area}
参照元URL: ${sourceUrl}

【執筆レギュレーション】
1. タイトル（title_ja）は読者の興味を引く魅力的なSEOタイトルにしてください（30〜35文字程度）。
2. 本文（content_ja）は必ず以下のHTML構造（<h2>, <p>）で、合計800文字以上の具体的で読み応えのある記事にしてください。
   - <h2>スポットの魅力と旬の見どころ</h2>
   - <h2>旅を楽しむおすすめの巡り方・ポイント</h2>
   - <h2>基本情報とアクセス</h2>
3. 英語（title_en, content_en）および韓国語（title_ko, content_ko）も、簡略化せず同等の充実度で作成してください。

【出力形式】
JSONオブジェクトのみを出力してください。Markdownバッククォートは不要です。
{
  "title_ja": "...",
  "content_ja": "<h2>...</h2><p>...</p>",
  "title_en": "...",
  "content_en": "<h2>...</h2><p>...</p>",
  "title_ko": "...",
  "content_ko": "<h2>...</h2><p>...</p>"
}
`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    const data = await res.json();
    const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (txt) return JSON.parse(txt);
  } catch (e) {
    console.error("Gemini APIエラー:", e.message);
  }
  return null;
}

// 簡易RSSパース処理
async function fetchRssItems(feed) {
  try {
    const res = await fetch(feed.url);
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
      // 既存記事の重複チェック
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
      console.log(`✍️ Geminiが記事をオリジナル執筆中: [${area}] ${item.title}`);

      const article = await generateDeepArticle(item.title, item.desc, item.link, area);
      if (!article) continue;

      const timestamp = Date.now().toString().slice(-8);
      const slug = `${area}-${timestamp}`;
      const thumb = PHOTO_BANK[area] || PHOTO_BANK["北海道"];

      // blog_posts テーブルに保存
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
        console.error("❌ 保存エラー:", error.message);
      } else {
        console.log(`🎉 肉厚ブログ記事を公開しました: ${article.title_ja}`);
      }
    }
  }

  console.log("🏁 すべての収集・執筆処理が完了しました。");
}

main();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase環境変数が設定されていません。");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// ハッシュタグや不要文字のクリーニング
function cleanTitle(rawTitle) {
  return rawTitle.replace(/#\S+/g, '').replace(/【.*?】/g, '').trim();
}

// エリア自動判別
function detectArea(text) {
  const areas = ['札幌', '函館', '小樽', '富良野', '美瑛', '旭川', '知床', '登別', '洞爺湖', '苫小牧', '釧路', '帯広'];
  for (const a of areas) {
    if (text.includes(a)) return a;
  }
  return '北海道';
}

// AI記事生成
async function generatePost(title, desc) {
  const clean = cleanTitle(title);
  const area = detectArea(`${clean} ${desc}`);

  const prompt = `
あなたは北海道旅行メディア「HOKKAIDO CLIPS」のプロのトラベルライターです。
以下のYouTube動画情報をもとに、読者が行きたくなる魅力的なブログ記事（日本語・英語・韓国語）を執筆してください。

動画タイトル: ${title}
動画説明: ${desc}
対象エリア: ${area}

【執筆ルール】
1. タイトルはハッシュタグを含めず、読者がクリックしたくなる魅力的なブログタイトルにしてください（30文字前後）。
2. content_jaはHTMLタグ（<h2>, <p>など）を使い、見どころ・おすすめポイント・魅力を300〜500文字程度でしっかり書いてください。
3. 英語（en）と韓国語（ko）も同様に作成してください。

【出力フォーマット（有効なJSONのみ）】
{
  "area": "${area}",
  "map_query": "${area} ${clean.slice(0, 10)}",
  "title_ja": "魅力的な日本語タイトル",
  "content_ja": "<h2>見どころ</h2><p>本文...</p><h2>おすすめポイント</h2><p>本文...</p>",
  "title_en": "English Title",
  "content_en": "<h2>Highlights</h2><p>Body...</p>",
  "title_ko": "한국어 제목",
  "content_ko": "<h2>주요 특징</h2><p>본문...</p>"
}
`;

  // 1. Gemini API (gemini-1.5-flash / gemini-2.5-flash 対応)
  if (GEMINI_API_KEY) {
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
      if (txt) {
        console.log("🤖 Geminiで記事を自動生成しました");
        return JSON.parse(txt);
      }
    } catch (e) {
      console.warn("⚠️ Gemini生成失敗、フォールバックを試みます:", e.message);
    }
  }

  // 2. OpenAI API
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      const data = await res.json();
      const txt = data.choices?.[0]?.message?.content;
      if (txt) {
        console.log("🤖 OpenAIで記事を自動生成しました");
        return JSON.parse(txt);
      }
    } catch (e) {
      console.warn("⚠️ OpenAI生成失敗:", e.message);
    }
  }

  // AIキーがない場合の自動成形
  return {
    area: area,
    map_query: `${area} 観光`,
    title_ja: clean || title,
    content_ja: `<h2>${area}の魅力スポット</h2><p>${clean}の魅力や旬の情報を紹介します。北海道旅行の旅程にぜひ取り入れてみてください。</p><h2>現地情報</h2><p>${desc.replace(/#\S+/g, '') || '詳細は現地の案内または公式情報をご確認ください。'}</p>`,
    title_en: clean || title,
    content_en: `<h2>Discover ${area}</h2><p>Exploring the wonderful spots in Hokkaido.</p>`,
    title_ko: clean || title,
    content_ko: `<h2>${area} 여행 가이드</h2><p>홋카이도의 매력적인 관광 명소를 소개합니다.</p>`
  };
}

async function main() {
  console.log("🚀 クロール＆ブログ生成を開始します...");

  if (!YOUTUBE_API_KEY) {
    console.error("❌ YOUTUBE_API_KEY がありません。");
    return;
  }

  const query = encodeURIComponent("北海道 旅行 おすすめ");
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoDuration=short&maxResults=10&order=date&key=${YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      console.log("⚠️ 取得できる動画がありませんでした。");
      return;
    }

    for (const item of data.items) {
      const videoId = item.id.videoId;
      if (!videoId) continue;

      const videoTitle = item.snippet.title;
      const desc = item.snippet.description || "";
      const thumb = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "https://images.unsplash.com/photo-1503899036084-c55cdd92da26";

      const { data: existingSpot } = await supabase
        .from("spots")
        .select("id")
        .eq("youtube_id", videoId)
        .maybeSingle();

      if (existingSpot) {
        console.log(`⏭️ 登録済みスキップ: ${videoTitle}`);
        continue;
      }

      console.log(`✍️ 記事生成開始: ${videoTitle}`);
      const ai = await generatePost(videoTitle, desc);
      const safeArea = ai.area || "北海道";

      // 1. spots テーブル
      await supabase.from("spots").insert({
        title: videoTitle,
        youtube_id: videoId,
        area: safeArea,
        map_query: ai.map_query || `${safeArea} 観光`,
        thumbnail_url: thumb
      });

      // 2. blog_posts テーブル
      const timestamp = Date.now().toString().slice(-8);
      const slug = `${safeArea}-${timestamp}`;

      const { error: blogErr } = await supabase.from("blog_posts").insert({
        slug: slug,
        area: safeArea,
        title_ja: ai.title_ja || cleanTitle(videoTitle),
        content_ja: ai.content_ja,
        title_en: ai.title_en || cleanTitle(videoTitle),
        content_en: ai.content_en,
        title_ko: ai.title_ko || cleanTitle(videoTitle),
        content_ko: ai.content_ko,
        thumbnail_url: thumb,
        source_name: "HOKKAIDO CLIPS 編集部 & AIトラベルライター",
        source_url: "https://hokkaido-clips.com"
      });

      if (blogErr) {
        console.error("❌ blog_posts保存失敗:", blogErr.message);
      } else {
        console.log(`🎉 ブログ記事 保存成功: ${ai.title_ja}`);
      }
    }

    console.log("🏁 完了しました。");
  } catch (err) {
    console.error("❌ エラー:", err);
  }
}

main();

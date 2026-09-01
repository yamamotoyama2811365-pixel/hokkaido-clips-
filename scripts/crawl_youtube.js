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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// AIによるブログ記事・スポット情報の自動生成
async function generateBlogContent(videoTitle, videoDescription) {
  const prompt = `
以下の北海道旅行のYouTube動画情報から、魅力的なブログ記事と観光スポット情報をJSON形式で作成してください。

動画タイトル: ${videoTitle}
動画説明文: ${videoDescription}

【出力フォーマット（必ず有効なJSONのみを出力してください）】
{
  "spot_name": "具体的なスポット名（例: 白金青い池、小樽運河など）",
  "area": "札幌",
  "map_query": "Googleマップ検索用スポット名",
  "summary": "100文字程度の概要",
  "article_title_ja": "魅力的な日本語タイトル",
  "article_title_en": "English Title",
  "article_title_ko": "한국어 제목",
  "content_ja": "<h2>見どころ</h2><p>本文...</p><h2>アクセス</h2><p>アクセス方法...</p>",
  "content_en": "<p>English Content</p>",
  "content_ko": "<p>Korean Content</p>"
}
`;

  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return JSON.parse(text);
    } catch (e) {
      console.warn("⚠️ Gemini生成失敗:", e.message);
    }
  }

  if (OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return JSON.parse(text);
    } catch (e) {
      console.warn("⚠️ OpenAI生成失敗:", e.message);
    }
  }

  return {
    spot_name: videoTitle.slice(0, 30),
    area: "北海道",
    map_query: `北海道 ${videoTitle.slice(0, 20)}`,
    summary: videoDescription.slice(0, 100) || "北海道の魅力的なスポット紹介です。",
    article_title_ja: videoTitle,
    article_title_en: videoTitle,
    article_title_ko: videoTitle,
    content_ja: `<h2>見どころ</h2><p>${videoDescription || videoTitle}</p><h2>アクセス</h2><p>詳細は現地情報をご確認ください。</p>`,
    content_en: `<p>${videoTitle}</p>`,
    content_ko: `<p>${videoTitle}</p>`
  };
}

async function main() {
  console.log("🚀 YouTube自動クロールを開始します...");

  if (!YOUTUBE_API_KEY) {
    console.error("❌ YOUTUBE_API_KEY が設定されていません。");
    return;
  }

  const query = encodeURIComponent("北海道 旅行 ショート OR おすすめ");
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoDuration=short&maxResults=10&order=date&key=${YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(url);
    const searchData = await res.json();

    if (!searchData.items || searchData.items.length === 0) {
      console.log("⚠️ 取得できるYouTube動画がありませんでした。");
      return;
    }

    for (const item of searchData.items) {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const description = item.snippet.description || "";
      const thumbnailUrl = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url;

      // 重複チェック
      const { data: existingSpot } = await supabase
        .from("spots")
        .select("id")
        .eq("youtube_id", videoId)
        .maybeSingle();

      if (existingSpot) {
        console.log(`⏭️ 既存在庫のためスキップ: ${title}`);
        continue;
      }

      console.log(`✨ 新規動画を処理中: ${title}`);
      const aiData = await generateBlogContent(title, description);

      const safeArea = aiData.area || "北海道";
      const safeMapQuery = aiData.map_query || aiData.spot_name || `${safeArea} ${title.slice(0, 15)}`;
      const slug = `hokkaido-${videoId}-${Date.now().toString().slice(-4)}`;

      // 1. spots テーブルへの保存
      const { error: spotError } = await supabase
        .from("spots")
        .insert({
          title: title,
          youtube_id: videoId,
          area: safeArea,
          map_query: safeMapQuery,
          thumbnail_url: thumbnailUrl
        });

      if (spotError) {
        console.error("❌ spots保存エラー:", spotError.message);
        continue;
      }

      // 2. blog_posts テーブルへの保存
      const { error: blogError } = await supabase
        .from("blog_posts")
        .insert({
          slug: slug,
          title: aiData.article_title_ja || title,
          title_ja: aiData.article_title_ja || title,
          title_en: aiData.article_title_en || title,
          title_ko: aiData.article_title_ko || title,
          content: aiData.content_ja,
          content_ja: aiData.content_ja,
          content_en: aiData.content_en,
          content_ko: aiData.content_ko,
          summary: aiData.summary || "",
          area: safeArea,
          thumbnail_url: thumbnailUrl,
          youtube_id: videoId
        });

      if (blogError) {
        console.error("❌ blog_posts保存エラー:", blogError.message);
      } else {
        console.log(`🎉 ブログ記事作成完了: ${aiData.article_title_ja || title}`);
      }
    }

    console.log("✨ すべての自動クロール & ブログ生成が完了しました。");
  } catch (err) {
    console.error("❌ 実行中エラー:", err);
  }
}

main();

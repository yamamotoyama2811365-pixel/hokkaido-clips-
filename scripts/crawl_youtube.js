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

// AIによる多言語ブログ記事生成
async function generateBlogContent(videoTitle, videoDescription) {
  const prompt = `
以下の北海道旅行のYouTube動画情報をもとに、日本語・英語・韓国語のブログ記事コンテンツをJSON形式で作成してください。

動画タイトル: ${videoTitle}
動画説明文: ${videoDescription}

【JSON出力フォーマット】
{
  "spot_name": "観光地名",
  "area": "札幌",
  "map_query": "Googleマップ検索キーワード",
  "summary": "100文字程度の概要",
  "title_ja": "魅力的な日本語ブログタイトル",
  "title_en": "Attractive English Blog Title",
  "title_ko": "매력적인 한국어 블로그 제목",
  "content_ja": "<h2>紹介</h2><p>本文...</p><h2>見どころ</h2><p>見どころ...</p><h2>アクセス</h2><p>アクセス方法...</p>",
  "content_en": "<h2>Introduction</h2><p>Content...</p><h2>Highlights</h2><p>Highlights...</p>",
  "content_ko": "<h2>소개</h2><p>본문...</p><h2>주요 볼거리</h2><p>볼거리...</p>"
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
    title_ja: videoTitle,
    title_en: videoTitle,
    title_ko: videoTitle,
    content_ja: `<h2>紹介</h2><p>${videoDescription || videoTitle}</p>`,
    content_en: `<h2>Introduction</h2><p>${videoDescription || videoTitle}</p>`,
    content_ko: `<h2>소개</h2><p>${videoDescription || videoTitle}</p>`
  };
}

async function main() {
  console.log("🚀 YouTubeクロール & ブログ生成を開始します...");

  if (!YOUTUBE_API_KEY) {
    console.error("❌ YOUTUBE_API_KEY がありません。");
    return;
  }

  const query = encodeURIComponent("北海道 旅行 おすすめ");
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoDuration=short&maxResults=10&order=date&key=${YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(url);
    const searchData = await res.json();

    if (!searchData.items || searchData.items.length === 0) {
      console.log("⚠️ 取得可能な動画がありませんでした。");
      return;
    }

    for (const item of searchData.items) {
      const videoId = item.id.videoId;
      if (!videoId) continue;

      const title = item.snippet.title;
      const description = item.snippet.description || "";
      const thumbnailUrl = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "https://images.unsplash.com/photo-1503899036084-c55cdd92da26";

      // 既存記事のチェック
      const { data: existingBlog } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("youtube_id", videoId)
        .maybeSingle();

      if (existingBlog) {
        console.log(`⏭️ 登録済みのためスキップ: ${title}`);
        continue;
      }

      console.log(`✨ 記事生成中: ${title}`);
      const aiData = await generateBlogContent(title, description);

      const safeArea = aiData.area || "北海道";
      const safeMapQuery = aiData.map_query || aiData.spot_name || `${safeArea} ${title.slice(0, 15)}`;
      const slug = `${safeArea}-${Date.now().toString().slice(-8)}`;

      // 1. spots テーブルへの保存
      await supabase.from("spots").upsert({
        title: title,
        youtube_id: videoId,
        area: safeArea,
        map_query: safeMapQuery,
        thumbnail_url: thumbnailUrl
      }, { onConflict: 'youtube_id' });

      // 2. blog_posts テーブルへの保存（実スキーマ完全一致データ）
      const blogPayload = {
        slug: slug,
        title: aiData.title_ja || title,
        title_ja: aiData.title_ja || title,
        title_en: aiData.title_en || title,
        title_ko: aiData.title_ko || title,
        content: aiData.content_ja,
        content_ja: aiData.content_ja,
        content_en: aiData.content_en,
        content_ko: aiData.content_ko,
        summary: aiData.summary || "",
        area: safeArea,
        thumbnail_url: thumbnailUrl,
        youtube_id: videoId,
        source_name: "HOKKAIDO CLIPS 編集部 & AIトラベルライター",
        source_url: "https://hokkaido-clips.com"
      };

      const { error: blogError } = await supabase
        .from("blog_posts")
        .insert(blogPayload);

      if (blogError) {
        console.error("❌ blog_posts保存エラー:", blogError.message);
      } else {
        console.log(`🎉 ブログ記事作成完了: ${aiData.title_ja || title}`);
      }
    }

    console.log("✨ 全処理が完了しました。");
  } catch (err) {
    console.error("❌ 実行エラー:", err);
  }
}

main();

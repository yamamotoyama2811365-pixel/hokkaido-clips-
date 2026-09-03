const { createClient } = require('@supabase/supabase-js');

// 環境変数の取得
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

// AIによる多言語ブログ記事の生成
async function generatePost(title, desc) {
  const prompt = `
以下の北海道旅行に関するYouTube動画から、日本語・英語・韓国語のブログ記事コンテンツをJSON形式で作成してください。

動画タイトル: ${title}
動画説明文: ${desc}

【出力フォーマット（JSON形式のみ出力してください）】
{
  "area": "札幌",
  "map_query": "札幌 時計台",
  "title_ja": "日本語タイトル",
  "content_ja": "<h2>見どころ</h2><p>本文...</p><h2>アクセス</h2><p>詳細...</p>",
  "title_en": "English Title",
  "content_en": "<h2>Highlights</h2><p>Content...</p>",
  "title_ko": "한국어 제목",
  "content_ko": "<h2>주요 특징</h2><p>내용...</p>"
}
`;

  // Gemini API がある場合
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
      if (txt) return JSON.parse(txt);
    } catch (e) {}
  }

  // OpenAI API がある場合
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
      if (txt) return JSON.parse(txt);
    } catch (e) {}
  }

  // APIがない場合のフォールバック
  return {
    area: "北海道",
    map_query: `北海道 ${title.slice(0, 10)}`,
    title_ja: title,
    content_ja: `<h2>スポット紹介</h2><p>${desc || title}</p>`,
    title_en: title,
    content_en: `<h2>Spot Overview</h2><p>${desc || title}</p>`,
    title_ko: title,
    content_ko: `<h2>스팟 소개</h2><p>${desc || title}</p>`
  };
}

async function main() {
  console.log("🚀 自動クロール＆記事生成処理を開始します...");

  if (!YOUTUBE_API_KEY) {
    console.error("❌ YOUTUBE_API_KEY が見つかりません。");
    return;
  }

  const query = encodeURIComponent("北海道 旅行 おすすめ");
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoDuration=short&maxResults=10&order=date&key=${YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      console.log("⚠️ 取得可能な新着動画がありませんでした。");
      return;
    }

    for (const item of data.items) {
      const videoId = item.id.videoId;
      if (!videoId) continue;

      const videoTitle = item.snippet.title;
      const desc = item.snippet.description || "";
      const thumb = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "https://images.unsplash.com/photo-1503899036084-c55cdd92da26";

      // 1. 重複チェック（spotsテーブル）
      const { data: existingSpot } = await supabase
        .from("spots")
        .select("id")
        .eq("youtube_id", videoId)
        .maybeSingle();

      if (existingSpot) {
        console.log(`⏭️ スキップ（登録済み）: ${videoTitle}`);
        continue;
      }

      console.log(`✨ 記事生成中: ${videoTitle}`);
      const ai = await generatePost(videoTitle, desc);
      const safeArea = ai.area || "北海道";

      // 2. spots テーブルに保存
      await supabase.from("spots").insert({
        title: videoTitle,
        youtube_id: videoId,
        area: safeArea,
        map_query: ai.map_query || `${safeArea} ${videoTitle.slice(0, 10)}`,
        thumbnail_url: thumb
      });

      // 3. blog_posts テーブルに保存（8/30まで動いていた完全仕様）
      const timestamp = Date.now().toString().slice(-8);
      const slug = `${safeArea}-${timestamp}`;

      const { error: blogErr } = await supabase.from("blog_posts").insert({
        slug: slug,
        title_ja: ai.title_ja || videoTitle,
        content_ja: ai.content_ja,
        title_en: ai.title_en || videoTitle,
        content_en: ai.content_en,
        title_ko: ai.title_ko || videoTitle,
        content_ko: ai.content_ko,
        thumbnail_url: thumb,
        source_name: "HOKKAIDO CLIPS 編集部 & AIトラベルライター",
        source_url: "https://hokkaido-clips.com"
      });

      if (blogErr) {
        console.error("❌ blog_posts 保存エラー:", blogErr.message);
      } else {
        console.log(`🎉 記事追加成功: ${ai.title_ja || videoTitle}`);
      }
    }

    console.log("🏁 すべての処理が完了しました。");
  } catch (err) {
    console.error("❌ 処理全体のエラー:", err);
  }
}

main();

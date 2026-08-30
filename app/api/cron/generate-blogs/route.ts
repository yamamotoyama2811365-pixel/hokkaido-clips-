import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
  
  if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
    return NextResponse.json({ success: false, error: '環境変数（SupabaseまたはOpenAI）が不足しています。' }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const RANDOM_VARIATIONS = [
    "初心者向けのモデルコースと穴場スポット",
    "地元民だけが知るディープな魅力と最新トレンド",
    "写真映えする絶景スポットと絶品グルメの完全ガイド",
    "限られた時間でも大満足できる効率的な周遊プラン"
  ];
  
  const currentVariation = RANDOM_VARIATIONS[Math.floor(Math.random() * RANDOM_VARIATIONS.length)];

  const TARGET_SPOTS = [
    { name: "札幌・大通公園", area: "札幌" },
    { name: "小樽運河", area: "小樽" },
    { name: "函館山ロープウェイ", area: "函館" },
    { name: "富良野・美瑛の四季彩の丘", area: "富良野・美瑛" },
    { name: "定山渓温泉", area: "定山渓" },
    { name: "旭山動物園", area: "旭川" }
  ];

  let generatedCount = 0;
  let errorLogs: string[] = [];

  function getUniquePhotoUrl(area: string): string {
    const timestamp = Date.now();
    // 各エリアごとに異なる複数の高画質フリー素材を用意して確実に変化させる
    if (area.includes("富良野")) return `https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&t=${timestamp}`;
    if (area.includes("旭川")) return `https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&t=${timestamp}`;
    if (area.includes("定山渓")) return `https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=1200&t=${timestamp}`;
    if (area.includes("函館")) return `https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&t=${timestamp}`;
    if (area.includes("小樽")) return `https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=1200&t=${timestamp}`;
    return `https://images.unsplash.com/photo-1546874177-af3118e6e580?w=1200&t=${timestamp}`;
  }

  try {
    for (const spot of TARGET_SPOTS) {
      const uniqueSlug = `${spot.area}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const prompt = `
あなたは北海道のプロのトラベルライターです。
今回は「${currentVariation}」という切り口で、観光地「${spot.name}（エリア: ${spot.area}）」についての全く新しいブログ記事を執筆してください。
出力は必ず以下の純粋なJSONフォーマットのみ（マークダウンのバッククォートは一切不要）で行ってください。

【重要ルール】
- title_ja と content_ja は必ず自然な「日本語」で記述してください。
- title_en と content_en は必ず自然な「英語 (English)」で記述してください（日本語を混ぜないこと）。
- title_ko と content_ko は必ず自然な「韓国語 (한국어)」で記述してください。

{
  "title_ja": "日本語のユニークなタイトル",
  "content_ja": "HTMLタグを含んだ日本語の本文詳細",
  "title_en": "Unique English title",
  "content_en": "English blog content with HTML tags",
  "title_ko": "고유한 한국어 블로그 제목",
  "content_ko": "HTML 태그가 포함된 한국어 본문 내용"
}
      `;

      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.95
        })
      });

      const aiData = await aiRes.json();
      if (!aiData.choices || !aiData.choices[0]) {
        errorLogs.push(`AI生成失敗: ${spot.name}`);
        continue;
      }

      let rawContent = aiData.choices[0].message.content.trim();
      rawContent = rawContent.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

      let parsedArticle;
      try {
        parsedArticle = JSON.parse(rawContent);
      } catch (e) {
        errorLogs.push(`JSONパース失敗 (${spot.name}): ${rawContent}`);
        continue;
      }

      const thumbnail_url = getUniquePhotoUrl(spot.area);

      const { error: insertError } = await supabase.from('blog_posts').insert([
        {
          slug: uniqueSlug,
          area: spot.area,
          title_ja: parsedArticle.title_ja,
          content_ja: parsedArticle.content_ja,
          title_en: parsedArticle.title_en,
          content_en: parsedArticle.content_en,
          title_ko: parsedArticle.title_ko,
          content_ko: parsedArticle.content_ko,
          thumbnail_url: thumbnail_url,
          source_name: "HOKKAIDO CLIPS 編集部 & AIトラベルエディター",
          source_url: "[https://hokkaido-clips.com](https://hokkaido-clips.com)"
        }
      ]);

      if (insertError) {
        errorLogs.push(`インサートエラー (${spot.name}): ${insertError.message}`);
      } else {
        generatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `【AI完全新規生成】切口「${currentVariation}」で ${generatedCount}件 の記事を生成・登録しました！`,
      errors: errorLogs.length > 0 ? errorLogs : undefined
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

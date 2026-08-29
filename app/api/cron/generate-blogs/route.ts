import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ success: false, error: 'Supabaseの設定が不足しています。' }, { status: 400 });
  }

  if (!OPENAI_API_KEY) {
    return NextResponse.json({ success: false, error: 'OpenAI APIキーが設定されていません。' }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

  function getSpotSpecificPhoto(area: string, title: string): string {
    const text = `${area} ${title}`.toLowerCase();
    if (text.includes("富良野") || text.includes("美瑛")) {
      return "https://placehold.co/800x600/f43f5e/ffffff?text=Furano+Biei";
    }
    if (text.includes("旭川") || text.includes("旭山")) {
      return "https://placehold.co/800x600/f59e0b/ffffff?text=Asahiyama+Zoo";
    }
    if (text.includes("定山渓") || text.includes("温泉")) {
      return "https://placehold.co/800x600/10b981/ffffff?text=Jozankei+Onsen";
    }
    if (text.includes("函館") || text.includes("夜景")) {
      return "https://placehold.co/800x600/8b5cf6/ffffff?text=Hakodate+Night+View";
    }
    if (text.includes("小樽") || text.includes("運河")) {
      return "https://placehold.co/800x600/0ea5e9/ffffff?text=Otaru+Canal";
    }
    if (text.includes("札幌") || text.includes("大通")) {
      return "https://placehold.co/800x600/14b8a6/ffffff?text=Sapporo+Odori+Park";
    }
    return "https://placehold.co/800x600/64748b/ffffff?text=Hokkaido+Travel";
  }

  try {
    const { data: existingBlogs } = await supabase.from('blog_posts').select('area');
    const existingAreas = new Set((existingBlogs || []).map((b: any) => b.area));

    for (const spot of TARGET_SPOTS) {
      if (existingAreas.has(spot.area)) {
        continue;
      }

      const randomStr = Math.random().toString(36).substring(2, 7);
      const slugValue = `${spot.area}-${Date.now()}-${randomStr}`;

      const prompt = `
あなたは北海道のプロのトラベルライターです。
観光地「${spot.name}（エリア: ${spot.area}）」について、旅行者が思わず行きたくなるような魅力的なブログ記事を作成してください。
必ず以下のJSONフォーマット（マークダウンのコードブロックは不要、純粋なJSONのみ）で出力してください。

{
  "title_ja": "日本語タイトル",
  "content_ja": "日本語のブログ本文（HTMLタグ含む）",
  "title_en": "English title for SEO",
  "content_en": "English blog post content with HTML tags",
  "title_ko": "한국어 블로그 제목",
  "content_ko": "가독성이 좋은 한국어 블로그 본문 내용 (HTML 태그 포함)"
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
          temperature: 0.7
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
        errorLogs.push(`JSONパース失敗: ${spot.name}`);
        continue;
      }

      const thumbnail_url = getSpotSpecificPhoto(spot.area, spot.name);

      const { error: insertError } = await supabase.from('blog_posts').insert([
        {
          slug: slugValue,
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
        existingAreas.add(spot.area);
      }
    }

    return NextResponse.json({
      success: true,
      message: `多言語ブログ記事を ${generatedCount}件 正常に登録しました！`,
      errors: errorLogs.length > 0 ? errorLogs : undefined
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

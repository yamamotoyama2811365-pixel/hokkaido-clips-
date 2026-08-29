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
      return "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80";
    }
    if (text.includes("旭川") || text.includes("旭山")) {
      return "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&auto=format&fit=crop&q=80";
    }
    if (text.includes("定山渓") || text.includes("温泉")) {
      return "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=1200&auto=format&fit=crop&q=80";
    }
    if (text.includes("函館") || text.includes("夜景")) {
      return "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80";
    }
    if (text.includes("小樽") || text.includes("運河")) {
      return "https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=1200&auto=format&fit=crop&q=80";
    }
    if (text.includes("札幌") || text.includes("大通")) {
      return "https://images.unsplash.com/photo-1546874177-af3118e6e580?w=1200&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80";
  }

  try {
    for (const spot of TARGET_SPOTS) {
      const randomStr = Math.random().toString(36).substring(2, 7);
      const slug = `${spot.area}-${Date.now()}-${randomStr}`;

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

      // 正式な日本語テーブル名「ブログ記事」に対してインサート
      const { error: insertError } = await supabase.from('ブログ記事').insert([
        {
          slug: slug,
          area: spot.area,
          タイトル_ja: parsedArticle.title_ja,
          コンテンツ_ja: parsedArticle.content_ja,
          タイトル_en: parsedArticle.title_en,
          コンテンツ_en: parsedArticle.content_en,
          タイトル_ko: parsedArticle.title_ko,
          コンテンツ_ko: parsedArticle.content_ko,
          thumbnail_url: thumbnail_url
        }
      ]);

      if (insertError) {
        errorLogs.push(insertError.message);
      } else {
        generatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `「ブログ記事」テーブルに多言語ブログを ${generatedCount}件 登録しました！`,
      errors: errorLogs.length > 0 ? errorLogs : undefined
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

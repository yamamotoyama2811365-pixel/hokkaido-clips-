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
    { name: "札幌・大通公園", area: "札幌", keyword: "Odori Park Sapporo sightseeing" },
    { name: "小樽運河", area: "小樽", keyword: "Otaru Canal tourism" },
    { name: "函館山ロープウェイ", area: "函館", keyword: "Mount Hakodate night view" },
    { name: "富良野・美瑛の四季彩の丘", area: "富良野・美瑛", keyword: "Biei Furano flower fields" },
    { name: "定山渓温泉", area: "定山渓", keyword: "Jozankei hot spring" },
    { name: "旭山動物園", area: "旭川", keyword: "Asahiyama Zoo" }
  ];

  let generatedCount = 0;
  let errorLogs: string[] = [];

  try {
    for (const spot of TARGET_SPOTS) {
      const randomStr = Math.random().toString(36).substring(2, 7);
      const slug = `${spot.area}-${Date.now()}-${randomStr}`;

      const prompt = `
あなたは北海道のプロのトラベルライターです。
観光地「${spot.name}（エリア: ${spot.area}）」について、旅行者が思わず行きたくなるような魅力的なブログ記事を作成してください。
以下のJSONフォーマット（マークダウンのコードブロックは不要、純粋なJSONのみ）で出力してください。

{
  "title_ja": "特徴を含めた魅力的な日本語タイトル（例: 【札幌・大通公園】雪まつりだけじゃない！四季折々の見どころ）",
  "content_ja": "H2見出しや段落を使った読みやすい日本語のブログ本文（HTMLタグやマークダウンで構成）",
  
  "title_en": "Attractive English title for SEO",
  "content_en": "Engaging English blog post content with paragraphs and headings",
  
  "title_ko": "매력적인 한국어 블로그 제목",
  "content_ko": "가독성이 좋은 한국어 블로그 본문 내용"
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

      const sampleImages = [
        "[https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80](https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80)",
        "[https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&auto=format&fit=crop&q=80](https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&auto=format&fit=crop&q=80)",
        "[https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80](https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80)"
      ];
      const thumbnail_url = sampleImages[Math.floor(Math.random() * sampleImages.length)];

      const { error: insertError } = await supabase.from('blog_posts').insert([
        {
          slug: slug,
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
        errorLogs.push(insertError.message);
      } else {
        generatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `多言語ブログ記事を ${generatedCount}件 自動生成してデータベースに登録しました！`,
      errors: errorLogs.length > 0 ? errorLogs : undefined
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

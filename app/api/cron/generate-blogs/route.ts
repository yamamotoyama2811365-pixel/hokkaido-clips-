import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
  
  if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
    return NextResponse.json({ success: false, error: '環境変数（SupabaseまたはOpenAI）が不足しています。' }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const MASTER_SPOTS = [
    { name: "札幌・大通公園", area: "札幌", keywords: "観光, モデルコース, イルミネーション, グルメ" },
    { name: "小樽運河", area: "小樽", keywords: "散策, レトロ, 海鮮グルメ, 写真映え" },
    { name: "函館山ロープウェイ", area: "函館", keywords: "夜景, 絶景, アクセス, 函館観光" },
    { name: "富良野・美瑛の四季彩の丘", area: "富良野・美瑛", keywords: "花畑, ドライブ, 絶景, 写真スポット" },
    { name: "定山渓温泉", area: "定山渓", keywords: "温泉, 渓谷, 日帰り, 札幌近郊" },
    { name: "旭山動物園", area: "旭川", keywords: "行動展示, ペンギン, ファミリー, 観光" },
    { name: "知床五湖の絶景遊歩道", area: "知床", keywords: "世界遺産, 大自然, 野生動物, トレッキング" },
    { name: "登別温泉・地獄谷", area: "登別", keywords: "温泉街, 地獄谷, 観光スポット, 硫黄泉" },
    { name: "洞爺湖のサイロ展望台", area: "洞爺湖", keywords: "絶景, 湖, ドライブ, 有珠山" },
    { name: "美瑛・白金青い池", area: "美瑛", keywords: "絶景, ライトアップ, 写真映え, 不思議な景色" }
  ];

  // 1回の実行につき1〜2件の濃い記事を丁寧に生成する
  const TARGET_SPOTS = [...MASTER_SPOTS].sort(() => Math.random() - 0.5).slice(0, 2);
  let generatedCount = 0;
  let errorLogs: string[] = [];

  function getSafeHokkaidoPhotoUrl(): string {
    const timestamp = Date.now();
    const HOKKAIDO_PHOTOS = [
      `https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&t=${timestamp}`,
      `https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&t=${timestamp}`,
      `https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&t=${timestamp}`,
      `https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=1200&t=${timestamp}`,
      `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&t=${timestamp}`
    ];
    return HOKKAIDO_PHOTOS[Math.floor(Math.random() * HOKKAIDO_PHOTOS.length)];
  }

  const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

  try {
    for (const spot of TARGET_SPOTS) {
      const uniqueSlug = `${spot.area}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // 1. SEO特化の長文・リッチな日本語記事生成プロンプト
      const promptJa = `
あなたは北海道旅行の専門メディアのシニア・トラベルライターです。
今回は観光地「${spot.name}（エリア: ${spot.area}）」について、検索ユーザーの悩みを完全に解決し、SEOで上位表示を狙える**極めて詳細で充実した長文ブログ記事**を日本語で執筆してください。

以下の要件を必ず満たしてください：
- 文字数は十分に多く（HTMLの段落やリストを含めてボリュームを持たせる）、訪問者が知りたい情報（見どころ、おすすめの季節、周辺のグルメ・お土産、アクセス・注意点）を網羅すること。
- 「${spot.keywords}」などの検索されやすい関連キーワードを自然に文章中に散りばめること。
- HTMLタグ（<h2>, <h3>, <p>, <ul>, <li>, <strong>等）をふんだんに使い、読みやすく構造化された美しいレイアウトにすること。

出力は必ず以下の純粋なJSONフォーマットのみ（マークダウンのバッククォートは一切不要）で行ってください。

{
  "title_ja": "SEOを意識した魅力的な日本語のタイトル（例: 【${spot.name}の完全ガイド】見どころ・絶景スポット・アクセス徹底解説）",
  "content_ja": "<h2>導入文...</h2><p>...</p><h2>見どころ...</h2><p>...</p><h2>アクセス・基本情報...</h2><p>...</p>"
}
      `;

      const aiResJa = await fetch(OPENAI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: promptJa }],
          temperature: 0.7
        })
      });

      const aiDataJa = await aiResJa.json();
      let rawJa = aiDataJa.choices[0].message.content.trim().replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
      let parsedJa = JSON.parse(rawJa);

      // 2. 英語生成
      const promptEn = `
Translate and adapt the following Japanese travel article into professional, natural English for international tourists, keeping HTML structure.
Output ONLY pure JSON (no markdown backticks):

{
  "title_en": "SEO friendly English title",
  "content_en": "<h2>Introduction</h2><p>...</p>"
}

Japanese Title: ${parsedJa.title_ja}
Japanese Content: ${parsedJa.content_ja}
      `;

      const aiResEn = await fetch(OPENAI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: promptEn }],
          temperature: 0.7
        })
      });

      let title_en = `Complete Guide to ${spot.name}`;
      let content_en = `<p>Discover the beauty and attractions of ${spot.name} in Hokkaido.</p>`;
      try {
        const aiDataEn = await aiResEn.json();
        let rawEn = aiDataEn.choices[0].message.content.trim().replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
        let parsedEn = JSON.parse(rawEn);
        if (parsedEn.title_en) title_en = parsedEn.title_en;
        if (parsedEn.content_en) content_en = parsedEn.content_en;
      } catch (e) {}

      // 3. 韓国語生成
      const promptKo = `
다음 일본어 여행 블로그 글을 외국인 관광객을 위한 자연스럽고 전문적인 한국어 SEO 최적화 글로 번역하세요. HTML 태그 유지.
오직 순수한 JSON 형식으로만 출력하세요 (마크다운 백틱 금지):

{
  "title_ko": "한국어 SEO 제목",
  "content_ko": "<h2>소개</h2><p>...</p>"
}

일본어 제목: ${parsedJa.title_ja}
일본어 본문: ${parsedJa.content_ja}
      `;

      const aiResKo = await fetch(OPENAI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: promptKo }],
          temperature: 0.7
        })
      });

      let title_ko = `${spot.name} 완벽 가이드`;
      let content_ko = `<p>${spot.name}의 멋진 매력을 만나보세요.</p>`;
      try {
        const aiDataKo = await aiResKo.json();
        let rawKo = aiDataKo.choices[0].message.content.trim().replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
        let parsedKo = JSON.parse(rawKo);
        if (parsedKo.title_ko) title_ko = parsedKo.title_ko;
        if (parsedKo.content_ko) content_ko = parsedKo.content_ko;
      } catch (e) {}

      const thumbnail_url = getSafeHokkaidoPhotoUrl();

      // Supabaseへ保存
      const { error: insertError } = await supabase.from('blog_posts').insert([
        {
          slug: uniqueSlug,
          area: spot.area,
          title_ja: parsedJa.title_ja,
          content_ja: parsedJa.content_ja,
          title_en: title_en,
          content_en: content_en,
          title_ko: title_ko,
          content_ko: content_ko,
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
      message: `【SEO長文最適化】${generatedCount}件の高品質な記事を登録しました！`,
      errors: errorLogs.length > 0 ? errorLogs : undefined
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

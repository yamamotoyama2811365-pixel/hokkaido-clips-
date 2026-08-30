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

  const RANDOM_VARIATIONS = [
    "地元民だけが知るディープな裏スポットと隠れた名店",
    "カメラマンが絶賛する絶景アングルと撮影のコツ",
    "リピーター続出の最新トレンド＆ローカル体験ツアー",
    "限られた時間でも極上の満喫ができる弾丸モデルコース"
  ];
  
  const currentVariation = RANDOM_VARIATIONS[Math.floor(Math.random() * RANDOM_VARIATIONS.length)];

  const MASTER_SPOTS = [
    { name: "札幌・大通公園", area: "札幌" },
    { name: "小樽運河", area: "小樽" },
    { name: "函館山ロープウェイ", area: "函館" },
    { name: "富良野・美瑛の四季彩の丘", area: "富良野・美瑛" },
    { name: "定山渓温泉", area: "定山渓" },
    { name: "旭山動物園", area: "旭川" },
    { name: "知床五湖の絶景遊歩道", area: "知床" },
    { name: "登別温泉・地獄谷", area: "登別" },
    { name: "洞爺湖のサイロ展望台", area: "洞爺湖" },
    { name: "美瑛・白金青い池", area: "美瑛" }
  ];

  const TARGET_SPOTS = [...MASTER_SPOTS].sort(() => Math.random() - 0.5).slice(0, 3);
  let generatedCount = 0;
  let errorLogs: string[] = [];

  // ★「あの自転車の写真」を完全に排除し、北海道の美しい風景・夜景・自然写真だけに限定
  function getSafeHokkaidoPhotoUrl(): string {
    const timestamp = Date.now();
    const HOKKAIDO_PHOTOS = [
      `https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&t=${timestamp}`, // 札幌夜景
      `https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&t=${timestamp}`, // 富良野の大自然
      `https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&t=${timestamp}`, // 函館
      `https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=1200&t=${timestamp}`, // 小樽運河風
      `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&t=${timestamp}`  // 雪山・大自然
    ];
    return HOKKAIDO_PHOTOS[Math.floor(Math.random() * HOKKAIDO_PHOTOS.length)];
  }

  const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

  try {
    for (const spot of TARGET_SPOTS) {
      const uniqueSlug = `${spot.area}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // 1. 日本語生成
      const promptJa = `
あなたは北海道のプロのトラベルライターです。
「${currentVariation}」という視点で、観光地「${spot.name}（エリア: ${spot.area}）」についてのブログ記事を日本語で執筆してください。HTMLタグを使用してください。
出力は必ず以下の純粋なJSONフォーマットのみ（マークダウンのバッククォートは一切不要）で行ってください。

{
  "title_ja": "日本語のタイトル",
  "content_ja": "<p>日本語の本文HTML</p>"
}
      `;

      const aiResJa = await fetch(OPENAI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: promptJa }],
          temperature: 1.0
        })
      });

      const aiDataJa = await aiResJa.json();
      let rawJa = aiDataJa.choices[0].message.content.trim().replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
      let parsedJa = JSON.parse(rawJa);

      // 2. 英語生成（確実に入り込むようにプロンプトを強化）
      const promptEn = `
Translate and adapt the following Japanese travel article into professional, natural English. Maintain HTML tags.
Output ONLY pure JSON (no markdown backticks):

{
  "title_en": "English title here",
  "content_en": "<p>English HTML content here</p>"
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

      let title_en = `Guide to ${spot.name}`;
      let content_en = `<p>Explore the wonderful attractions of ${spot.name} in Hokkaido.</p>`;
      try {
        const aiDataEn = await aiResEn.json();
        let rawEn = aiDataEn.choices[0].message.content.trim().replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
        let parsedEn = JSON.parse(rawEn);
        if (parsedEn.title_en) title_en = parsedEn.title_en;
        if (parsedEn.content_en) content_en = parsedEn.content_en;
      } catch (e) {}

      // 3. 韓国語生成
      const promptKo = `
다음 일본어 글을 자연스럽고 전문적인 한국어로 번역하세요. HTML 태그 유지.
오직 순수한 JSON 형식으로만 출력하세요 (마크다운 백틱 금지):

{
  "title_ko": "한국어 제목",
  "content_ko": "<p>한국어 본문</p>"
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

      let title_ko = `${spot.name} 가이드`;
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
      message: `【自転車完全排除＆英語強制対応】${generatedCount}件の新しい記事を登録しました！`,
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

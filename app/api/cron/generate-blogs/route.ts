import { NextResponse } from 'next/server';

export async function GET() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
  
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ success: false, error: 'OpenAI APIキーが設定されていません。' }, { status: 400 });
  }

  const spot = { name: "札幌・大通公園", area: "札幌" };
  const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

  try {
    // 1. 日本語の生成テスト
    const promptJa = `
あなたは北海道のプロのトラベルライターです。
「札幌・大通公園」についてのブログ記事を日本語で執筆してください。
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
        temperature: 0.9
      })
    });

    const aiDataJa = await aiResJa.json();
    if (!aiDataJa.choices || !aiDataJa.choices[0]) {
      return NextResponse.json({ success: false, error: "日本語AI生成のレスポンスが空です", raw: aiDataJa }, { status: 500 });
    }

    let rawJa = aiDataJa.choices[0].message.content.trim().replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    let parsedJa;
    try {
      parsedJa = JSON.parse(rawJa);
    } catch (e) {
      return NextResponse.json({ success: false, error: "日本語JSONパース失敗", rawText: rawJa }, { status: 500 });
    }

    // 2. 英語の生成テスト
    const promptEn = `
Translate and adapt the following Japanese article into natural English. Maintain HTML tags.
Output ONLY pure JSON (no markdown backticks):

{
  "title_en": "English title",
  "content_en": "<p>English HTML content</p>"
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

    const aiDataEn = await aiResEn.json();
    let parsedEn = {};
    try {
      let rawEn = aiDataEn.choices[0].message.content.trim().replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
      parsedEn = JSON.parse(rawEn);
    } catch (e) {
      parsedEn = { error: "英語パース失敗", raw: aiDataEn.choices?.[0]?.message?.content };
    }

    // 3. 韓国語の生成テスト
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

    const aiDataKo = await aiResKo.json();
    let parsedKo = {};
    try {
      let rawKo = aiDataKo.choices[0].message.content.trim().replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
      parsedKo = JSON.parse(rawKo);
    } catch (e) {
      parsedKo = { error: "韓国語パース失敗", raw: aiDataKo.choices?.[0]?.message?.content };
    }

    // データベースには入れず、生成された結果をそのまま画面にJSONで返す
    return NextResponse.json({
      success: true,
      message: "【デバッグ用：AI生成テスト結果】",
      generated_japanese: parsedJa,
      generated_english: parsedEn,
      generated_korean: parsedKo
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

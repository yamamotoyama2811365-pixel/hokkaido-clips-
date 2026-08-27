import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { rawText, videoThumb, videoId, videoType } = await req.json();

    if (!rawText) {
      return NextResponse.json({ error: "テキストを入力してください" }, { status: 400 });
    }

    const prompt = `
以下のSNS投稿テキストから、旅行アプリ用のスポット情報を抽出してJSONで出力してください。

【出力フォーマット (JSON形式のみ)】
{
  "title": "店名・スポット名 (例: 元祖さっぽろラーメン横丁)",
  "genre": "food / souvenir / stay / spot / night のいずれか1つ",
  "area": "エリア名 (例: 札幌・すすきの, 函館・元町)",
  "crowd_status": "low / medium / high のいずれか",
  "crowd_text": "混雑状況の目安 (例: やや混雑 (待ち時間 約15分))",
  "ai_summary": "スポットの魅力・特徴をまとめた1〜2文の要約解説",
  "best_time": "おすすめの訪問時間帯 (例: 17:00〜18:30が穴場)",
  "map_query": "Googleマップ検索用キーワード (例: 元祖さっぽろラーメン横丁)",
  "souvenirs": [
    {
      "name": "お土産・名物名 (テキスト内に言及がある場合のみ)",
      "description": "そのお土産の特徴やおすすめポイント"
    }
  ]
}

【SNS投稿テキスト】
${rawText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");

    // Supabaseのspotsテーブルへ登録
    const { data: insertedSpot, error: spotError } = await supabase
      .from("spots")
      .insert({
        title: parsed.title,
        genre: parsed.genre,
        area: parsed.area,
        video_thumb: videoThumb || "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80",
        video_type: videoType || "youtube",
        video_id: videoId || "LXb3EKWsInQ",
        crowd_status: parsed.crowd_status || "low",
        crowd_text: parsed.crowd_text || "スムーズに入店可能",
        ai_summary: parsed.ai_summary,
        best_time: parsed.best_time,
        map_query: parsed.map_query,
      })
      .select()
      .single();

    if (spotError) throw spotError;

    // お土産情報が存在する場合はsouvenirsテーブルへ登録
    if (parsed.souvenirs && parsed.souvenirs.length > 0 && insertedSpot) {
      const souvenirsToInsert = parsed.souvenirs.map((s: { name: string; description: string }) => ({
        spot_id: insertedSpot.id,
        name: s.name,
        description: s.description,
      }));

      await supabase.from("souvenirs").insert(souvenirsToInsert);
    }

    return NextResponse.json({ success: true, spot: insertedSpot });
  } catch (error: any) {
    console.error("抽出登録エラー:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
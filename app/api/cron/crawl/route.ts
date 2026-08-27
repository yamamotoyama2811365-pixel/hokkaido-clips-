import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase";
import OpenAI from "openai";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key is not configured." }, { status: 500 });
  }

  // リクエストが実行された時に初めてOpenAIインスタンスを作成する（ビルド時のクラッシュを防ぐ）
  const openai = new OpenAI({ apiKey });

  try {
    const { text } = await req.json();
    // 実際の処理
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
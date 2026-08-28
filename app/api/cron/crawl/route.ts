import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ success: false, error: 'Supabaseの設定が不足しています。' }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ success: false, error: 'YouTube APIキーが設定されていません。' }, { status: 400 });
  }

  const SEARCH_QUERIES = [
    'すすきの キャバクラ',
    'すすきの ナイトクラブ',
    'すすきの スナック',
    'KING XMHU 札幌'
  ];

  let addedCount = 0;
  let errorLogs: string[] = [];

  try {
    for (const query of SEARCH_QUERIES) {
      // YouTube Data APIの検索用URL（動画オブジェクトを確実に絞り込む）
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (!data.items) {
        if (data.error) errorLogs.push(data.error.message);
        continue;
      }

      for (const item of data.items) {
        // 安全ガード：IDの構造が正しくないものはスキップ
        if (!item.id || typeof item.id.videoId !== 'string' || !item.id.videoId) {
          continue;
        }

        const videoId = item.id.videoId;
        const title = item.snippet?.title || '';
        // サムネイルとIDの紐づけが狂わないよう、明示的にアイテムごとの高解像度画像を取得
        const thumb = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '';
        const description = item.snippet?.description || '';

        if (!videoId || !title) continue;

        // 既存チェック（同一の正確な video_id がすでに登録されていないか）
        const { data: existing, error: checkError } = await supabase
          .from('spots')
          .select('id')
          .eq('video_id', videoId)
          .maybeSingle();

        if (checkError) {
          console.error('Check error:', checkError.message);
          continue;
        }

        if (!existing) {
          const { error: insertError } = await supabase.from('spots').insert([
            {
              title: title,
              genre: 'night',
              area: 'すすきの',
              video_type: 'youtube',
              video_id: videoId,
              video_thumb: thumb,
              crowd_status: 'medium',
              crowd_text: '最新SNS動画・要チェック',
              ai_summary: description ? description.slice(0, 100) + '...' : 'すすきののリアルなナイトライフがわかる最新動画。',
              best_time: '21:00 〜 朝まで',
              map_query: 'すすきの 札幌市中央区'
            }
          ]);

          if (insertError) {
            errorLogs.push(insertError.message);
          } else {
            addedCount++;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${addedCount}件の動画IDズレ防止済みデータを処理しました！`,
      errors: errorLogs.length > 0 ? errorLogs : undefined
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

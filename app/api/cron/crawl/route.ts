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

  // ジンギスカン、スープカレー、宿、必需品などを含めた収集ターゲットリスト
  const SEARCH_TARGETS = [
    { query: 'すすきの キャバクラ', genre: 'night', area: 'すすきの' },
    { query: 'すすきの ナイトクラブ', genre: 'night', area: 'すすきの' },
    { query: 'すすきの スナック', genre: 'night', area: 'すすきの' },
    { query: 'KING XMHU 札幌', genre: 'night', area: 'すすきの' },
    { query: '札幌 ジンギスカン', genre: 'gourmet', area: '札幌' },
    { query: '札幌 スープカレー', genre: 'gourmet', area: '札幌' },
    { query: '札幌 ラーメン', genre: 'gourmet', area: '札幌' },
    { query: '札幌 グルメ ランチ', genre: 'gourmet', area: '札幌' },
    { query: '定山渓 温泉 宿泊', genre: 'stay', area: '道央' },
    { query: '札幌 ホテル おすすめ', genre: 'stay', area: '札幌' },
    { query: '北海道旅行 持ち物 必需品', genre: 'travel_gear', area: '北海道' },
    { query: '札幌 観光 スポット', genre: 'spot', area: '札幌' }
  ];

  let addedCount = 0;
  let errorLogs: string[] = [];

  try {
    for (const target of SEARCH_TARGETS) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(target.query)}&type=video&key=${YOUTUBE_API_KEY}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (!data.items) {
        if (data.error) errorLogs.push(data.error.message);
        continue;
      }

      for (const item of data.items) {
        if (!item || !item.id || typeof item.id.videoId !== 'string' || !item.id.videoId) {
          continue;
        }

        const videoId = item.id.videoId;

        if (videoId === '9bZkp7q19f0' || videoId.length < 5) {
          continue;
        }

        const title = item.snippet?.title || '';
        const thumb = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '';
        const description = item.snippet?.description || '';

        if (!videoId || !title) continue;

        // 重複チェック
        const { data: existing, error: checkError } = await supabase
          .from('spots')
          .select('id')
          .eq('video_id', videoId)
          .maybeSingle();

        if (checkError) {
          continue;
        }

        if (!existing) {
          const { error: insertError } = await supabase.from('spots'].insert([
            {
              title: title,
              genre: target.genre,
              area: target.area,
              video_type: 'youtube',
              video_id: videoId,
              video_thumb: thumb,
              crowd_status: 'medium',
              crowd_text: '最新SNS動画・要チェック',
              ai_summary: description ? description.slice(0, 100) + '...' : '現地のリアルな雰囲気がわかる最新動画。',
              best_time: target.genre === 'night' ? '21:00 〜 朝まで' : '日中 〜 夜',
              map_query: `${target.area} 札幌市`
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
      message: `一括追加クローラーにより ${addedCount}件の動画を新しく登録しました！`,
      errors: errorLogs.length > 0 ? errorLogs : undefined
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

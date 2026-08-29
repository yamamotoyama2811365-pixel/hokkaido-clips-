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

  // 札幌多め＋北海道全体（函館・小樽・富良野・道東など）のバランス型ターゲットリスト
  const SEARCH_TARGETS = [
    // すすきの・ナイト系
    { query: 'すすきの キャバクラ', genre: 'night', area: 'すすきの' },
    { query: 'すすきの ナイトクラブ', genre: 'night', area: 'すすきの' },
    { query: 'すすきの スナック', genre: 'night', area: 'すすきの' },
    { query: 'KING XMHU 札幌', genre: 'night', area: 'すすきの' },
    
    // 札幌グルメ（細分化して被りを防止）
    { query: '札幌 ジンギスカン 有名店', genre: 'food', area: '札幌' },
    { query: '札幌 スープカレー 行列', genre: 'food', area: '札幌' },
    { query: '札幌 味噌ラーメン 観光', genre: 'food', area: '札幌' },
    { query: '札幌 シメパフェ 夜パフェ', genre: 'food', area: '札幌' },
    { query: '札幌 海鮮丼 朝市 グルメ', genre: 'food', area: '札幌' },

    // 北海道各地のグルメ・観光・スポット
    { query: '小樽 観光 グルメ 寿司', genre: 'spot', area: '小樽' },
    { query: '函館 観光 夜景 海鮮', genre: 'spot', area: '函館' },
    { query: '富良野 美瑛 観光 ドライブ', genre: 'spot', area: '富良野・美瑛' },
    { query: '知床 釧路 観光 大自然', genre: 'spot', area: '道東' },

    // 宿泊・温泉
    { query: '定山渓 温泉 宿泊 おすすめ', genre: 'stay', area: '定山渓' },
    { query: '函館 温泉 ホテル 宿泊', genre: 'stay', area: '函館' },
    { query: '札幌 ホテル 朝食 ランク', genre: 'stay', area: '札幌' },

    // お土産・旅の必需品
    { query: '新千歳空港 限定 お土産', genre: 'souvenir', area: '千歳' },
    { query: '北海道旅行 持ち物 必需品 防寒', genre: 'travel_gear', area: '北海道' }
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
          const { error: insertError } = await supabase.from('spots').insert([
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
              map_query: `${target.area} 北海道`
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
      message: `バランス型クロールにより ${addedCount}件の動画を新しく登録しました！`,
      errors: errorLogs.length > 0 ? errorLogs : undefined
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

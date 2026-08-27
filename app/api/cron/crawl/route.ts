// fetch-night-videos.js
import { createClient } from '@supabase/supabase-js';

// Supabaseの設定（あなたの環境に合わせて書き換えてください）
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// YouTube Data APIキー
const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY';

// 検索したいキーワード（ここを増やせば色々な動画が自動収集されます）
const SEARCH_QUERIES = [
  'すすきの キャバクラ',
  'すすきの ナイトクラブ',
  'すすきの スナック',
  'KING XMHU 札幌'
];

async function fetchAndSaveVideos() {
  console.log('🔄 すすきのナイト動画の自動収集中...');

  for (const query of SEARCH_QUERIES) {
    // YouTube Data APIで動画を検索（ショート動画や関連動画をヒットさせる）
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&videoDuration=short&key=${YOUTUBE_API_KEY}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data.items) continue;

      for (const item of data.items) {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumb = item.snippet.thumbnails.high.url;
        const description = item.snippet.description;

        // 1. すでにSupabaseに同じ動画が存在するかチェック
        const { data: existing } = await supabase
          .from('spots')
          .select('id')
          .eq('video_id', videoId)
          .single();

        if (!existing) {
          // 2. なければ新しいスポット（ナイト系）として自動登録！
          const { error } = await supabase.from('spots').insert([
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

          if (error) {
            console.error('❌ 登録エラー:', error.message);
          } else {
            console.log(`✅ 新規追加成功: ${title}`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ 検索エラー (${query}):`, err);
    }
  }
  console.log('✨ 自動収集とデータベース更新が完了しました！');
}

fetchAndSaveVideos();
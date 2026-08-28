// scripts/crawl_youtube.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const youtubeApiKey = process.env.YOUTUBE_API_KEY;

if (!supabaseUrl || !supabaseKey || !youtubeApiKey) {
  console.error("必要な環境変数が設定されていません。");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SEARCH_QUERIES = [
  "北海道 観光 ショート",
  "札幌 グルメ ショート",
  "小樽 観光 ショート",
  "函館 夜景 ショート",
  "すすきの グルメ ショート"
];

async function fetchYouTubeShorts(query) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&q=${encodeURIComponent(query)}&key=${youtubeApiKey}&maxResults=5`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.items) return [];

  return data.items.map(item => ({
    title: item.snippet.title,
    video_id: item.id.videoId,
    video_thumb: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    area: "北海道",
    genre: "spot",
    crowd_status: "medium",
    crowd_text: "AI自動収集トレンド",
    ai_summary: `YouTube自動クローラーが収集した「${item.snippet.title}」の最新ショート動画です。`,
    best_time: "いつでもおすすめ",
    video_type: "youtube"
  }));
}

async function main() {
  console.log("🚀 YouTube自動クロールを開始します...");
  
  for (const q of SEARCH_QUERIES) {
    try {
      const spots = await fetchYouTubeShorts(q);
      for (const spot of spots) {
        const { data: existing } = await supabase
          .from('spots')
          .select('id')
          .eq('video_id', spot.video_id)
          .single();

        if (!existing) {
          const { error } = await supabase.from('spots').insert([spot]);
          if (error) {
            console.error("Supabase挿入エラー:", error.message);
          } else {
            console.log(`✅ 新規スポット追加成功: ${spot.title} (${spot.video_id})`);
          }
        } else {
          console.log(`⏭️ 既存在庫のためスキップ: ${spot.title}`);
        }
      }
    } catch (err) {
      console.error(`クエリ "${q}" の処理中にエラー:`, err);
    }
  }
  console.log("✨ YouTube自動クロールが完了しました。");
}

main();
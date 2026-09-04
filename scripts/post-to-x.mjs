import { TwitterApi } from 'twitter-api-v2';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = twitterClient.readWrite;
const SITE_BASE_URL = (process.env.SITE_BASE_URL || 'https://hokkaido-clips.vercel.app').replace(/\/$/, '');

async function postLatestBlogToX() {
  console.log('--- X自動投稿タスク開始 ---');

  // 1. まだXに投稿していない最新記事を1件取得
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .is('tweeted_at', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Supabaseからの取得エラー:', error);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('投稿対象の未ポスト記事はありません。');
    return;
  }

  const post = posts[0];
  const targetUrl = `${SITE_BASE_URL}/blog/${post.slug || post.id}`;
  const title = post.タイトル_ja || post.title_ja || post.title || '北海道の最新注目スポット';
  const area = post.area ? `#${post.area.replace(/\s+/g, '')}` : '#北海道旅行';

  // 2. 魅力的な文面を構築（URLを末尾に置くことでXのOGPカードを展開）
  const tweetText = `【AIが検知🔥 いま注目の北海道スポット】

📍 ${title}

公式一次情報とトレンド動画からAIが見どころ・アクセスを徹底解説！
現地の最新情報をチェック👇

${targetUrl}

${area} #北海道観光 #HOKKAIDO_CLIPS`;

  try {
    // 3. X API v2 でツイート
    const res = await rwClient.v2.tweet(tweetText);
    console.log(`ツイート成功！ Tweet ID: ${res.data.id}`);

    // 4. 二重投稿防止フラグを更新
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ tweeted_at: new Date().toISOString() })
      .eq('id', post.id);

    if (updateError) {
      console.error('tweeted_at の更新失敗:', updateError);
    } else {
      console.log(`Supabaseの tweeted_at を更新しました (Post ID: ${post.id})`);
    }
  } catch (err) {
    console.error('Xへの投稿に失敗しました:', err);
    process.exit(1);
  }
}

postLatestBlogToX();

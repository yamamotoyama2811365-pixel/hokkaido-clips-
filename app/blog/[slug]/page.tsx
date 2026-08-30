import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Supabaseクライアント作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = params;

  // Supabaseからslug（またはid）に一致するブログ記事を1件取得
  let post: any = null;
  const { data: bySlug } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (bySlug) {
    post = bySlug;
  } else {
    // slugで見つからない場合はidでフォールバック検索
    const { data:ById } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', slug)
      .single();
    if (ById) post = ById;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <h1 className="text-xl font-bold">記事が見つかりませんでした</h1>
        <p className="text-xs text-slate-400">お探しの記事は削除されたか、URLが異なっています。</p>
        <Link href="/" className="px-4 py-2 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl">
          トップページへ戻る
        </Link>
      </div>
    );
  }

  const title = post.タイトル_ja || post.title_ja || post.title || "無題の記事";
  const content = post.コンテンツ_ja || post.content_ja || post.content || "<p>本文がありません。</p>";
  const thumbnail = post.thumbnail_url || "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&auto=format&fit=crop&q=80";

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 pb-20">
      {/* ヘッダーナビ */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-teal-400 font-extrabold text-xs">
            <span>←</span> <span>トップページに戻る</span>
          </Link>
          <span className="text-xs font-bold text-slate-400">HOKKAIDO CLIPS 記事詳細</span>
        </div>
      </header>

      {/* 記事メインコンテンツ */}
      <main className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/40">
              📍 {post.area || "北海道全般"}
            </span>
            <span className="text-[10px] text-slate-400">
              {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""} 公開
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
            {title}
          </h1>
        </div>

        {/* サムネイル画像 */}
        <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* 本文（SEOに対応したHTML描画） */}
        <article className="bg-slate-900/60 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-4">
          <div 
            dangerouslySetInnerHTML={{ __html: content }} 
            className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed [&>h2]:text-teal-300 [&>h2]:text-base sm:[&>h2]:text-lg [&>h2]:font-extrabold [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-teal-200 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4"
          />
        </article>

        {/* フッターリンク */}
        <div className="pt-6 border-t border-slate-800 text-center">
          <Link href="/" className="inline-block px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition">
            ほかの観光記事・動画を見る ➔
          </Link>
        </div>
      </main>
    </div>
  );
}

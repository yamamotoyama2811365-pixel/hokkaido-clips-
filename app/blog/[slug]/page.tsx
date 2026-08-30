import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { supabase } from "../../supabase";

interface BlogPost {
  id: string;
  slug?: string;
  title?: string;
  title_ja?: string;
  title_ko?: string;
  title_en?: string;
  タイトル_ja?: string;
  タイトル_ko?: string;
  タイトル_en?: string;
  content?: string;
  content_ja?: string;
  content_ko?: string;
  content_en?: string;
  コンテンツ_ja?: string;
  コンテンツ_ko?: string;
  コンテンツ_en?: string;
  summary?: string;
  area?: string;
  thumbnail_url?: string;
  created_at?: string;
}

// データベースから記事を取得する共通関数
async function getPostData(slug: string): Promise<BlogPost | null> {
  const decodedSlug = decodeURIComponent(slug);
  try {
    let { data } = await supabase
      .from("blog_posts")
      .select("*")
      .or(`id.eq.${decodedSlug},slug.eq.${decodedSlug}`)
      .maybeSingle();

    if (!data) {
      const res2 = await supabase
        .from("blogs")
        .select("*")
        .or(`id.eq.${decodedSlug},slug.eq.${decodedSlug}`)
        .maybeSingle();
      data = res2.data;
    }

    if (!data) {
      const { data: allPosts } = await supabase.from("blog_posts").select("*");
      if (allPosts && allPosts.length > 0) {
        data = allPosts.find((p: any) => p.id === decodedSlug || p.slug === decodedSlug);
      }
    }

    return data || null;
  } catch (err) {
    console.error("記事取得エラー:", err);
    return null;
  }
}

// 🔍 Google検索・SNSシェア用の動的メタデータを生成（SEO最重要）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostData(slug);

  if (!post) {
    return {
      title: "記事が見つかりませんでした | HOKKAIDO CLIPS",
    };
  }

  const title = post.タイトル_ja || post.title_ja || post.title || "北海道旅行レポート";
  const rawContent = post.コンテンツ_ja || post.content_ja || post.content || post.summary || "";
  // HTMLタグを除去して説明文（120文字）を作成
  const cleanDescription = rawContent
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  const thumbnail = post.thumbnail_url && post.thumbnail_url.startsWith("http")
    ? post.thumbnail_url
    : "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80";

  return {
    title: `${title} | HOKKAIDO CLIPS`,
    description: `${cleanDescription}... 北海道観光情報・旅行ガイド`,
    openGraph: {
      title: `${title} | HOKKAIDO CLIPS`,
      description: `${cleanDescription}...`,
      url: `https://hokkaido-travel-portal.vercel.app/blog/${slug}`,
      siteName: "HOKKAIDO CLIPS",
      images: [
        {
          url: thumbnail,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | HOKKAIDO CLIPS`,
      description: `${cleanDescription}...`,
      images: [thumbnail],
    },
  };
}

// 📄 ページ本体の描画（サーバーサイドレンダリングでクローラーに即認識させる）
export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostData(slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center space-y-4 px-4">
        <div className="text-3xl">📄</div>
        <p className="text-sm font-bold text-slate-400">該当する記事が見つかりませんでした。</p>
        <Link href="/" className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg transition">
          ← トップページへ戻る
        </Link>
      </div>
    );
  }

  const title = post.タイトル_ja || post.title_ja || post.title || "無題のレポート";
  const rawContent = post.コンテンツ_ja || post.content_ja || post.content || post.summary || "";
  const thumbnail = post.thumbnail_url && post.thumbnail_url.startsWith("http")
    ? post.thumbnail_url
    : "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80";

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 pb-20">
      <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="text-teal-400 hover:text-teal-300 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition">
            <span>←</span> <span>トップページに戻る</span>
          </Link>
          <span className="text-[11px] text-slate-500 font-black tracking-wider">HOKKAIDO CLIPS REPORT</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
              📍 {post.area || "北海道"}
            </span>
            <span className="text-xs text-slate-400">
              {post.created_at ? new Date(post.created_at).toLocaleDateString("ja-JP") : ""}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white leading-snug">
            {title}
          </h1>
        </div>

        <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* 記事本文 */}
        <article 
          className="bg-slate-900/60 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-4 text-slate-200 text-sm md:text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: rawContent }}
        />

        <div className="pt-8 border-t border-slate-800 flex justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-lg transition"
          >
            ← 観光地・動画一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}

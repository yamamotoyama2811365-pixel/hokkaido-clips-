"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return;
      try {
        // slug または id で検索
        let { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .single();

        if (!data) {
          const res2 = await supabase
            .from("blogs")
            .select("*")
            .or(`slug.eq.${slug},id.eq.${slug}`)
            .single();
          data = res2.data;
        }

        if (data) {
          setPost(data);
        }
      } catch (err) {
        console.error("記事取得エラー:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-teal-400 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🧭</div>
          <p className="text-xs tracking-wider">記事を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center space-y-4">
        <p className="text-sm">該当する記事が見つかりませんでした。</p>
        <Link href="/" className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs">
          トップページへ戻る
        </Link>
      </div>
    );
  }

  const title = post.タイトル_ja || post.title_ja || post.title || "無題のレポート";
  const content = post.コンテンツ_ja || post.content_ja || post.content || post.summary || "";
  const thumbnail = post.thumbnail_url && post.thumbnail_url.startsWith("http")
    ? post.thumbnail_url
    : "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop&q=80";

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      {/* 共通ヘッダー */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-teal-400 hover:text-teal-300 text-xs font-bold flex items-center gap-1.5 transition">
            <span>←</span> <span>トップページに戻る</span>
          </Link>
          <span className="text-[11px] text-slate-500 font-bold">HOKKAIDO CLIPS REPORT</span>
        </div>
      </header>

      {/* メイン記事本文エリア（全画面レイアウト） */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* メタ情報 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
              📍 {post.area || "北海道"}
            </span>
            <span className="text-xs text-slate-400">
              {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
            </span>
          </div>

          <h1 className="text-xl md:text-3xl font-black text-white leading-snug">
            {title}
          </h1>
        </div>

        {/* アイキャッチ画像 */}
        <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* 記事本文 */}
        <article className="prose prose-invert max-w-none text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
          {content}
        </article>

        {/* 記事下部 ナビゲーション */}
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

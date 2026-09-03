import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://hokkaido-travel-portal.vercel.app';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  let postUrls = '';

  // Supabaseからブログ記事一覧の取得を試みる
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, created_at')
        .limit(500);

      if (posts && posts.length > 0) {
        postUrls = posts.map((post) => {
          const date = post.created_at ? new Date(post.created_at).toISOString() : new Date().toISOString();
          return `
  <url>
    <loc>${baseUrl}/blog/${encodeURIComponent(post.slug)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }).join('');
      }
    } catch (e) {
      console.error('Sitemap fetch error:', e);
    }
  }

  // 静的ページの定義
  const staticPages = ['', '/blog', '/spots'].map((path) => `
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`).join('');

  // 1行目に確実にXMLヘッダーを出力する
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages}
${postUrls}
</urlset>`.trim();

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}

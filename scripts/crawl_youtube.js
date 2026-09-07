const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase環境変数が不足しています。");
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY が渡っていません。");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const FEEDS = [
  { name: "札幌観光協会 旬のたび", url: "https://www.sapporo.travel/feed/" },
  { name: "函館公式観光ガイド", url: "https://www.hakobura.jp/feed/" },
  { name: "北海道公式観光情報", url: "https://www.visit-hokkaido.jp/news/rss" },
  { name: "旭川観光コンベンション", url: "https://www.atca.or.jp/feed/" },
  { name: "小樽観光協会 おたるぽーたる", url: "https://otaru.gr.jp/feed" }
];

const YOUTUBE_QUERIES = [
  "北海道 観光 おすすめ",
  "富良野 美瑛 ドライブ",
  "小樽 グルメ 食べ歩き",
  "十勝 帯広 スイーツ 観光",
  "知床 釧路 道東 旅行"
];

const AREA_SLUG_MAP = {
  "札幌": "sapporo",
  "函館": "hakodate",
  "小樽": "otaru",
  "富良野": "furano",
  "美瑛": "biei",
  "旭川": "asahikawa",
  "知床": "shiretoko",
  "登別": "noboribetsu",
  "洞爺湖": "toya",
  "苫小牧": "tomakomai",
  "釧路": "kushiro",
  "帯広": "obihiro",
  "定山渓": "jozankei",
  "北海道": "hokkaido"
};

function detectArea(text) {
  const areas = ['札幌', '函館', '小樽', '富良野', '美瑛', '旭川', '知床', '登別', '洞爺湖', '苫小牧', '釧路', '帯広', '定山渓'];
  for (const a of areas) {
    if (text.includes(a)) return a;
  }
  return '北海道';
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateDeepArticle(rawTitle, rawText, sourceUrl, area) {
  const prompt = `
あなたは北海道専門トラベルメディア「HOKKAIDO CLIPS」のプロライターです。
以下の元ネタ情報をもとに、著作権侵害にならないよう完全オリジナル構成で読者に役立つ魅力的な旅行ブログ記事（日・英・韓）を執筆してください。
また、この記事のアイキャッチ写真を作成するための「英語の画像生成プロンプト」も作成してください。

元タイトル: ${rawTitle}
元内容: ${rawText}
対象エリア: ${area}
参照URL: ${sourceUrl}

【執筆ルール】
1. title_ja はクリックしたくなる魅力的なSEOタイトルにしてください（30〜35文字）。
2. content_ja は必ず<h2>と<p>を使い、以下の構成で800文字以上の具体的で読み応えのある本文にしてください。
   - <h2>注目の見どころと旬の魅力</h2>
   - <h2>旅行者におすすめの楽しみ方と巡り方</h2>
   - <h2>現地アクセスと基本情報</h2>
3. 英語（en）と韓国語（ko）も同様の品質で作成してください。
4. image_prompt は、この記事の観光地・スポット・グルメ・風景をリアルな旅行雑誌風の高画質写真として描くための「英語プロンプト」にしてください（例: "A breathtaking high-resolution photo of Otaru Canal at sunset with historic brick warehouses, soft warm lighting, professional travel photography" など。30〜40単語程度、文字入れやロゴ指示は禁止）。

【出力フォーマット（有効なJSONのみ出力）】
{
  "title_ja": "...",
  "content_ja": "<h2>...</h2><p>...</p>",
  "title_en": "...",
  "content_en": "<h2>...</h2><p>...</p>",
  "title_ko": "...",
  "content_ko": "<h2>...</h2><p>...</p>",
  "image_prompt": "..."
}
`;

  const models = ["gemini-2.5-flash"];

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await res.json();
      if (data.error) {
        console.warn(`⚠️ モデル ${model} 応答エラー: ${data.error.message}`);
        continue;
      }

      let txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (txt) {
        // ❌ 修正前: txt.replace(/```json/g, '').replace(/\n/g, '').trim(); 
        // ✅ 修正後 (コピペ時の構文エラー解消):
        txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(txt);
      }
    } catch (err) {
      console.warn(`⚠️ モデル ${model} 通信失敗: ${err.message}`);
    }
  }

  console.error("❌ Geminiでの生成に失敗しました。");
  return null;
}

async function fetchRssItems(feed) {
  try {
    const res = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const xml = await res.text();
    const items = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const raw of itemMatches.slice(0, 10)) {
      const titleMatch = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || raw.match(/<title>(.*?)<\/title>/);
      const linkMatch = raw.match(/<link>(.*?)<\/link>/);
      const descMatch = raw.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || raw.match(/<description>(.*?)<\/description>/);

      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const link = linkMatch ? linkMatch[1].trim() : '';
      const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      if (title && link) {
        items.push({ title, link, desc, sourceName: feed.name });
      }
    }
    return items;
  } catch (e) {
    console.warn(`フィード取得失敗 (${feed.name}):`, e.message);
    return [];
  }
}

async function fetchYouTubeItems(query) {
  if (!YOUTUBE_API_KEY) return [];
  try {
    const url = `[https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=$](https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=$){encodeURIComponent(query)}&relevanceLanguage=ja&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) return [];

    return data.items.map(item => ({
      title: item.snippet.title,
      link: `[https://www.youtube.com/watch?v=$](https://www.youtube.com/watch?v=$){item.id.videoId}`,
      desc: item.snippet.description,
      sourceName: "YouTube (" + item.snippet.channelTitle + ")"
    }));
  } catch (e) {
    console.warn(`YouTube検索失敗 (${query}):`, e.message);
    return [];
  }
}

async function main() {
  console.log("🚀 北海道観光記事の収集＆AI画像生成つき自動執筆を開始します...");
  let createdCount = 0;
  const MAX_PER_RUN = 5;

  const candidates = [];
  for (const feed of FEEDS) {
    console.log(`📡 フィード確認中: ${feed.name}`);
    const items = await fetchRssItems(feed);
    candidates.push(...items);
  }

  if (YOUTUBE_API_KEY) {
    for (const q of YOUTUBE_QUERIES) {
      console.log(`🎥 YouTube検索中: ${q}`);
      const ytItems = await fetchYouTubeItems(q);
      candidates.push(...ytItems);
    }
  }

  for (const item of candidates) {
    if (createdCount >= MAX_PER_RUN) {
      console.log(`🛑 1回の生成上限（${MAX_PER_RUN}件）に達したため終了します。`);
      break;
    }

    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("source_url", item.link)
      .maybeSingle();

    if (existing) {
      continue;
    }

    const area = detectArea(`${item.title} ${item.desc}`);
    console.log(`✍️ Gemini執筆 & 画像プロンプト考案中: [${area}] ${item.title}`);

    const article = await generateDeepArticle(item.title, item.desc, item.link, area);
    if (!article) {
      console.warn(`⚠️ 記事生成不可のためスキップ: ${item.title}`);
      continue;
    }

    const areaSlug = AREA_SLUG_MAP[area] || "hokkaido";
    const timestamp = Math.floor(Date.now() / 1000) + createdCount;
    const slug = `${areaSlug}-${timestamp}`;

    const promptParam = encodeURIComponent(article.image_prompt || `${area} Hokkaido travel scenic spot nature photography`);
    const seed = timestamp; 
    const thumb = `[https://image.pollinations.ai/prompt/$](https://image.pollinations.ai/prompt/$){promptParam}?width=1200&height=630&nologo=true&seed=${seed}`;

    const { error } = await supabase.from("blog_posts").insert({
      slug: slug,
      area: area,
      title_ja: article.title_ja,
      content_ja: article.content_ja,
      title_en: article.title_en,
      content_en: article.content_en,
      title_ko: article.title_ko,
      content_ko: article.content_ko,
      thumbnail_url: thumb,
      source_name: item.sourceName,
      source_url: item.link
    });

    if (error) {
      console.error("❌ Supabase保存エラー:", error.message);
    } else {
      createdCount++;
      console.log(`🎉 記事とAI画像を公開しました (${createdCount}/${MAX_PER_RUN}): ${article.title_ja}`);
      console.log(`   🖼️ 生成画像URL: ${thumb}`);
    }

    await sleep(3000);
  }

  console.log(`🏁 処理完了：新しく ${createdCount} 件の記事を作成しました。`);
}

main();

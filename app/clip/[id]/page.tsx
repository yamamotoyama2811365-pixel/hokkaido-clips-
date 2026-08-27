import { Metadata } from 'next';

async function getVideoData(id: string) {
  return {
    id,
    title: {
      ja: '札幌の絶品スープカレー店巡り #Shorts',
      en: 'Best Soup Curry tour in Sapporo #Shorts',
      ko: '삿포로 최고의 수프 커리 투어 #Shorts',
    },
    description: {
      ja: '札幌市内で食べられるゴロゴロ野菜の絶品スープカレーをご紹介！',
      en: 'Introducing the best soup curry with chunky vegetables in Sapporo!',
      ko: '삿포로 시내에서 맛볼 수 있는 큼직한 야채가 들어간 수프 커리 소개!',
    },
    thumbnailUrl: 'https://hokkaido-travel-portal.vercel.app/images/sample.jpg',
    videoUrl: 'https://hokkaido-travel-portal.vercel.app/videos/sample.mp4',
    uploadDate: '2026-08-27',
  };
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { lang = 'ja' } = await searchParams;
  const video = await getVideoData(id);

  const currentLang = (lang === 'en' || lang === 'ko' ? lang : 'ja') as 'ja' | 'en' | 'ko';
  const title = video.title[currentLang];
  const description = video.description[currentLang];
  const baseUrl = 'https://hokkaido-travel-portal.vercel.app';

  return {
    title: `${title} | HOKKAIDO CLIPS`,
    description: description,
    alternates: {
      canonical: `${baseUrl}/clip/${id}?lang=${currentLang}`,
      languages: {
        'ja': `${baseUrl}/clip/${id}?lang=ja`,
        'en': `${baseUrl}/clip/${id}?lang=en`,
        'ko': `${baseUrl}/clip/${id}?lang=ko`,
        'x-default': `${baseUrl}/clip/${id}?lang=ja`,
      },
    },
    openGraph: {
      title,
      description,
      images: [video.thumbnailUrl],
      type: 'video.other',
    },
  };
}

export default async function ClipPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { lang = 'ja' } = await searchParams;
  const video = await getVideoData(id);

  const currentLang = (lang === 'en' || lang === 'ko' ? lang : 'ja') as 'ja' | 'en' | 'ko';
  const title = video.title[currentLang];
  const description = video.description[currentLang];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    'name': title,
    'description': description,
    'thumbnailUrl': [video.thumbnailUrl],
    'uploadDate': video.uploadDate,
    'contentUrl': video.videoUrl,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 flex flex-col items-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-3xl space-y-6">
        <div className="flex gap-2 text-xs">
          <a href={`/clip/${id}?lang=ja`} className={`px-3 py-1 rounded transition ${currentLang === 'ja' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}>日本語</a>
          <a href={`/clip/${id}?lang=en`} className={`px-3 py-1 rounded transition ${currentLang === 'en' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}>English</a>
          <a href={`/clip/${id}?lang=ko`} className={`px-3 py-1 rounded transition ${currentLang === 'ko' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}>한국어</a>
        </div>

        <h1 className="text-2xl font-bold text-teal-400">{title}</h1>
        
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
          <p className="text-sm text-slate-300">{description}</p>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
            ID: {id} / 自動インデックス・多言語SEO対応済み
          </div>
        </div>

        <div>
          <a href="/" className="text-xs text-teal-400 hover:underline">← トップページに戻る</a>
        </div>
      </div>
    </main>
  );
}
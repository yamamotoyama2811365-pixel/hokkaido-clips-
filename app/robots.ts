import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://hokkaido-travel-portal.vercel.app/sitemap.xml',
  };
}

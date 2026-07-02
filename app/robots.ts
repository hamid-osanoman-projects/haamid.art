import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/work',
        '/blog',
        '/news',
        '/now',
        '/stats',
        '/tools',
        '/snippets',
        '/contact',
        '/review',
      ],
      disallow: [
        '/dashboard',
        '/dashboard/',
        '/works',
        '/clients',
        '/meetings',
        '/supabase',
        '/visitors',
        '/reviews',
        '/settings',
      ],
    },
    sitemap: 'https://haaamid.art/sitemap.xml',
  };
}

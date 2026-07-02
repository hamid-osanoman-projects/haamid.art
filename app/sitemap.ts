import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://haaamid.art';

  // Define static URL nodes
  const staticPaths = [
    '',
    '/work',
    '/blog',
    '/now',
    '/stats',
    '/tools',
    '/snippets',
    '/contact',
    '/review',
  ];

  const staticUrls: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1.0 : 0.8,
  }));

  let projectUrls: MetadataRoute.Sitemap = [];
  let blogUrls: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch published project case studies
    const { data: projects } = await supabase
      .from('projects')
      .select('slug, created_at')
      .eq('status', 'published');

    if (projects && projects.length > 0) {
      projectUrls = projects.map((p) => ({
        url: `${baseUrl}/work/${p.slug}`,
        lastModified: new Date(p.created_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }

    // Fetch published blog articles
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published');

    if (posts && posts.length > 0) {
      blogUrls = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.warn('Supabase fetch failed during sitemap compile, using static routes:', err);
  }

  return [...staticUrls, ...projectUrls, ...blogUrls];
}

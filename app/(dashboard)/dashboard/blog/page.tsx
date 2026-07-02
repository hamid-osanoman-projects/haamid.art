import React from 'react';
import { createClient } from '@/lib/supabase/server';
import BlogManager from '@/components/dashboard/BlogManager';

// Static default fallback blog posts list if database is empty or offline
const MOCK_DASHBOARD_POSTS = [
  {
    id: 'p1',
    title: 'The Rise of Vibe Coding and Agentic Assistants',
    slug: 'rise-of-vibe-coding',
    category: 'devlog',
    status: 'published' as const,
    views_count: 412,
    likes_count: 32,
    published_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'p2',
    title: 'Designing Anti-Gravity Interfaces with Three.js',
    slug: 'designing-antigravity-interfaces',
    category: 'opinion',
    status: 'published' as const,
    views_count: 589,
    likes_count: 52,
    published_at: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 'p3',
    title: 'Building Real-time Apps with Next.js 16 and Supabase',
    slug: 'building-realtime-nextjs-supabase',
    category: 'tutorial',
    status: 'draft' as const,
    views_count: 0,
    likes_count: 0
  }
];

export default async function DashboardBlogIndexPage() {
  let posts = MOCK_DASHBOARD_POSTS;

  try {
    const supabase = await createClient();
    
    // Fetch all posts (draft and published)
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      posts = data;
    }
  } catch (err) {
    console.warn('DB read failed in blog editor manager, using mock data:', err);
  }

  return (
    <div className="h-full">
      <BlogManager initialPosts={posts} />
    </div>
  );
}

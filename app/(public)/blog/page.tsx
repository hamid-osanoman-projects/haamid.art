import React from 'react';
import { createClient } from '@supabase/supabase-js';
import BlogIndex from '@/components/blog/BlogIndex';

// Fallback mock posts if Database is empty or offline
const MOCK_POSTS = [
  {
    id: 'p4',
    title: 'Building DevMerge: A React-Powered Suika Physics Clone',
    slug: 'building-devmerge-suika-physics',
    excerpt: 'Ever wanted to combine HTML and CSS to create React, but with bouncing physics? Here\'s a deep dive into building a Suika-style merge game using Matter.js.',
    category: 'tutorial' as const,
    tags: ['Matter.js', 'React', 'Physics', 'GameDev'],
    cover_image: '',
    published_at: new Date().toISOString(),
    read_time: 10,
    views_count: 105,
    likes_count: 42
  },
  {
    id: 'p5',
    title: 'Movie Hacker Screen: The Typing Simulator',
    slug: 'movie-hacker-screen-the-typing-simulator',
    excerpt: 'How to simulate high-speed movie-style hacking using randomized strings and React event interception.',
    category: 'tutorial' as const,
    tags: ['React', 'JavaScript', 'Entertainment'],
    cover_image: '',
    published_at: new Date(Date.now() - 1000).toISOString(),
    read_time: 8,
    views_count: 0,
    likes_count: 0
  },
  {
    id: 'p6',
    title: 'Building an Image to ASCII Art Generator',
    slug: 'building-an-image-to-ascii-art-generator',
    excerpt: 'How to use HTML5 Canvas to read the brightness of pixels and turn them into text-based vintage art.',
    category: 'tutorial' as const,
    tags: ['Canvas', 'React', 'Image Processing'],
    cover_image: '',
    published_at: new Date(Date.now() - 2000).toISOString(),
    read_time: 12,
    views_count: 0,
    likes_count: 0
  },
  {
    id: 'p7',
    title: 'Crafting Premium CSS Mesh Gradients',
    slug: 'crafting-premium-css-mesh-gradients',
    excerpt: 'How to build an interactive draggable canvas that generates complex CSS mesh backgrounds in real-time.',
    category: 'tutorial' as const,
    tags: ['CSS', 'React', 'Design'],
    cover_image: '',
    published_at: new Date(Date.now() - 3000).toISOString(),
    read_time: 6,
    views_count: 0,
    likes_count: 0
  },
  {
    id: 'p8',
    title: "How I Built the AI 'Roast My Site' Bot",
    slug: 'building-ai-portfolio-roaster',
    excerpt: 'Using Claude 3.5 Sonnet, Cheerio, and custom prompt engineering to build an unhinged Senior Engineer roasting bot.',
    category: 'devlog' as const,
    tags: ['AI', 'Anthropic', 'Prompt Engineering'],
    cover_image: '',
    published_at: new Date(Date.now() - 4000).toISOString(),
    read_time: 7,
    views_count: 0,
    likes_count: 0
  },
  {
    id: 'p9',
    title: 'Stacking the Web: Building Tech Stack Jenga',
    slug: 'building-tech-stack-jenga',
    excerpt: 'How to use Matter.js and React to build a fully playable 2D physics simulation of a Jenga tower.',
    category: 'tutorial' as const,
    tags: ['React', 'Matter.js', 'Physics'],
    cover_image: '',
    published_at: new Date(Date.now() - 5000).toISOString(),
    read_time: 8,
    views_count: 0,
    likes_count: 0
  },
  {
    id: 'p10',
    title: 'Building the Ultimate Physics Sandbox',
    slug: 'ultimate-physics-sandbox',
    excerpt: 'How to combine Matter.js and HTML5 Canvas to build a nostalgic, high-performance 2D rigid body sandbox.',
    category: 'devlog' as const,
    tags: ['Matter.js', 'Canvas', 'Games'],
    cover_image: '',
    published_at: new Date(Date.now() - 6000).toISOString(),
    read_time: 5,
    views_count: 0,
    likes_count: 0
  }
];

export default async function BlogIndexPage() {
  let posts = MOCK_POSTS;

  try {
    // Temporarily skipping DB fetch to show only the newly generated high-quality blogs
    /*
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Fetch published posts
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (!error && data) {
      // Merge DB posts with MOCK_POSTS (DB takes priority)
      const dbSlugs = new Set(data.map(p => p.slug));
      const missingMocks = MOCK_POSTS.filter(p => !dbSlugs.has(p.slug));
      
      posts = [...data, ...missingMocks].sort((a, b) => {
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });
    }
    */
  } catch (err) {
    console.warn('DB check failed in blog list, using premium fallbacks:', err);
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <BlogIndex initialPosts={posts} />
    </div>
  );
}

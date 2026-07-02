import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BlogEditor from '@/components/dashboard/BlogEditor';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: 'build_log' | 'tutorial' | 'opinion' | 'devlog';
  tags?: string[];
  status: 'draft' | 'published';
  cover_image?: string;
}

// Mock post lookup fallback matching initial MOCK_POSTS by id
const MOCK_POSTS = [
  {
    id: 'p1',
    title: 'The Rise of Vibe Coding and Agentic Assistants',
    slug: 'rise-of-vibe-coding',
    excerpt: 'Exploring how agentic coding assistants are changing the developer workflow and why focus is shifting from syntax to systemic architectures.',
    content: '## Introduction to Vibe Coding\n\nVibe coding is the practice of directing AI agents to write code while you focus on high-level architecture and application flows. Instead of typing syntax, you are aligning systems.',
    category: 'devlog' as const,
    tags: ['AI', 'VibeCoding'],
    status: 'published' as const
  },
  {
    id: 'p2',
    title: 'Designing Anti-Gravity Interfaces with Three.js',
    slug: 'designing-antigravity-interfaces',
    excerpt: 'Flat layouts are yielding to rich tactile dimensions. Let’s build a mouse-tracking particle background shader from scratch.',
    content: '## The Dimension of Tactile Web Design\n\nTactile interfaces are designs that feel premium, alive, and responsive. We use gradients, floats, and Three.js canvases to give visitors a depth experience.',
    category: 'opinion' as const,
    tags: ['Design', 'ThreeJS'],
    status: 'published' as const
  },
  {
    id: 'p3',
    title: 'Building Real-time Apps with Next.js 16 and Supabase',
    slug: 'building-realtime-nextjs-supabase',
    excerpt: 'A comprehensive tutorial setting up cookie-based session refreshes, protected route groups, and active triggers.',
    content: '## Implementing App Router Protected Routing\n\nNext.js 16 introduces refined route structures. We use a root-level proxy.ts convention to act as our edge router middleware, guarding paths.',
    category: 'tutorial' as const,
    tags: ['Next.js', 'Supabase'],
    status: 'draft' as const
  }
];

export default async function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = await createClient();

  if (id === 'new') {
    // Initialize a new draft post
    let newId = Math.random().toString(36).substring(2, 11);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const insertData = {
        title: 'Untitled Article',
        slug: 'untitled-article-' + Date.now(),
        excerpt: 'Write a brief description summary of this post.',
        category: 'devlog',
        tags: [],
        content: '## Enter introduction header here\n\nStart writing details...',
        status: 'draft',
        user_id: user?.id
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(insertData)
        .select()
        .single();

      if (!error && data) {
        newId = data.id;
      }
    } catch (err) {
      console.warn('DB creation of draft post failed, using local temporary ID:', err);
    }
    
    redirect(`/dashboard/blog/${newId}`);
  }

  // Load existing article from mocks or DB
  let post: BlogPost | undefined = MOCK_POSTS.find(p => p.id === id) as any;

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      post = data as any;
    }
  } catch (err) {
    console.warn('DB load of draft post failed, using local fallback:', err);
  }

  if (!post) {
    // If not found in mock list, provide a blank fallback template
    post = {
      id,
      title: 'Untitled Draft',
      slug: 'untitled-draft-' + id,
      excerpt: '',
      category: 'devlog',
      tags: [],
      content: '## Write post details here...',
      status: 'draft'
    };
  }

  return (
    <div className="h-full">
      <BlogEditor post={post} />
    </div>
  );
}

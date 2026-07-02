'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Pencil, Plus, Eye, ThumbsUp, Trash2, Calendar, FileText, ChevronRight, Sparkles 
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  category: string;
  views_count?: number;
  likes_count?: number;
  published_at?: string;
}

interface BlogManagerProps {
  initialPosts: BlogPost[];
}

export default function BlogManager({ initialPosts }: BlogManagerProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const router = useRouter();
  const supabase = createClient();

  const handleCreateNewDraft = async () => {
    // Redirect to the dynamic new identifier page
    router.push('/dashboard/blog/new');
  };

  const handleDeletePost = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (!error) {
        setPosts(prev => prev.filter(p => p.id !== id));
      } else {
        // Fallback local remove
        setPosts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Delete blog post failed:', err);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-xs font-semibold text-zinc-500">
      
      {/* -------------------- HEADER ACTIONS -------------------- */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#262626] pb-4">
        <div>
          <h2 className="text-zinc-800 dark:text-zinc-200 font-bold">Manage Articles & Build Logs</h2>
          <p className="text-[10px] text-zinc-400 mt-0.5">Write technical papers, log active project updates, and check reads performance.</p>
        </div>

        <button
          onClick={handleCreateNewDraft}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-2 px-4 font-bold text-white transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* -------------------- ARTICLES LIST -------------------- */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] shadow-sm">
        {posts.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase text-zinc-400 tracking-wider font-bold">
                <th className="px-6 py-4">Article Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Publish Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Reads</th>
                <th className="px-6 py-4 text-center">Likes</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {posts.map((post) => (
                <tr 
                  key={post.id}
                  onClick={() => router.push(`/dashboard/blog/${post.id}`)}
                  className="hover:bg-zinc-55/40 dark:hover:bg-[#1a1a1a]/60 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 max-w-sm truncate">{post.title}</td>
                  <td className="px-6 py-4 capitalize">{post.category.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-zinc-500">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      post.status === 'published' 
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                        : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-purple-400 font-bold">{post.views_count || 0}</td>
                  <td className="px-6 py-4 text-center text-zinc-500">{post.likes_count || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/blog/${post.id}`);
                        }}
                        className="p-1 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
                        title="Edit Article"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeletePost(post.id, e)}
                        className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                        title="Delete Article"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-[#141414]">
            <Sparkles className="h-8 w-8 text-purple-500/20 mx-auto mb-4 animate-pulse" />
            <p className="text-zinc-500 italic">No articles found in database.</p>
          </div>
        )}
      </div>

    </div>
  );
}

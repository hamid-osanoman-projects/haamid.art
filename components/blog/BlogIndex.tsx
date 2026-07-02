'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, Eye, ThumbsUp, Calendar, Clock, Tag, Mail, Sparkles, ChevronRight, MessageSquare 
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category: 'build_log' | 'tutorial' | 'opinion' | 'devlog';
  tags?: string[];
  cover_image?: string;
  published_at?: string;
  read_time?: number;
  views_count?: number;
  likes_count?: number;
}

interface BlogIndexProps {
  initialPosts: BlogPost[];
}

const CATEGORIES: { value: BlogPost['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All Articles' },
  { value: 'build_log', label: 'Build Logs' },
  { value: 'tutorial', label: 'Tutorials' },
  { value: 'opinion', label: 'Opinions' },
  { value: 'devlog', label: 'Devlogs' }
];

export default function BlogIndex({ initialPosts }: BlogIndexProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BlogPost['category'] | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Newsletter form state
  const [email, setEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  const handleSubscribeNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmittingNewsletter(true);
    // Simulate API subscribe
    setTimeout(() => {
      setNewsletterSubscribed(true);
      setSubmittingNewsletter(false);
      setEmail('');
    }, 800);
  };

  // Extract unique tags for sidebar cloud
  const allTags = Array.from(
    new Set(posts.flatMap(p => p.tags || []))
  ).slice(0, 12);

  // Get most read this month (top 3 by views)
  const popularPosts = [...posts]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 3);

  // Filtering calculations
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesTag = !selectedTag || (post.tags || []).includes(selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 bg-[#0a0a0a] text-zinc-100 font-sans select-none">
      
      {/* -------------------- HEADER TITLE -------------------- */}
      <div className="max-w-3xl mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 text-purple-400 bg-purple-950/30 px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/10">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Hamid's Notebook</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
          Thoughts, build logs, and dev insights.
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl">
          Deep-dives into systems engineering, Next.js architecture, WebGL graphics shaders, and the design ethics of building fast, modern software.
        </p>
      </div>

      {/* -------------------- FILTERS & SEARCH -------------------- */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-zinc-900 pb-6 mb-10">
        
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5 p-0.5 bg-zinc-950/80 rounded-xl border border-zinc-900 w-full md:w-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => {
                setSelectedCategory(cat.value);
                setSelectedTag(null); // Clear active tag cloud filter on category switch
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat.value && !selectedTag
                  ? 'bg-purple-950/30 text-purple-400 border border-purple-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
          {selectedTag && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-400 bg-purple-950/20 border border-purple-500/25 rounded-lg">
              <span>Tag: #{selectedTag}</span>
              <button onClick={() => setSelectedTag(null)} className="hover:text-white text-purple-500">×</button>
            </span>
          )}
        </div>

        {/* Live Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts or tags..."
            className="w-full rounded-xl border border-zinc-900 bg-zinc-950 py-2.5 pr-4 pl-11 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-500/40 transition-colors"
          />
        </div>

      </div>

      {/* -------------------- MAIN SPLIT: CARDS & SIDEBAR -------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Post Grid */}
        <main className="lg:col-span-8 space-y-8">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredPosts.map((post) => (
                <article 
                  key={post.id}
                  className="group flex flex-col justify-between rounded-2xl border border-zinc-900 bg-zinc-950/30 p-5 shadow-sm hover:border-purple-500/15 hover:shadow-2xl hover:shadow-purple-500/5 transition-all cursor-pointer"
                >
                  <Link href={`/blog/${post.slug}`} className="block space-y-4">
                    {/* Cover Image */}
                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-900">
                      {post.cover_image ? (
                        <Image
                          src={post.cover_image}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover group-hover:scale-103 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/20 via-zinc-900 to-zinc-950 flex items-center justify-center text-zinc-600">
                          <Sparkles className="h-8 w-8 text-purple-500/10" />
                        </div>
                      )}
                      
                      {/* Category Badge overlay */}
                      <span className={`absolute top-3 left-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        post.category === 'build_log' ? 'border-purple-500/30 bg-purple-950/80 text-purple-400' :
                        post.category === 'tutorial' ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-400' :
                        post.category === 'opinion' ? 'border-amber-500/30 bg-amber-950/80 text-amber-400' :
                        'border-blue-500/30 bg-blue-950/80 text-blue-400'
                      }`}>
                        {post.category.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Metadata details */}
                    <div className="flex items-center gap-3.5 text-[10px] font-bold text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{post.read_time || 5} min read</span>
                      </span>
                    </div>

                    {/* Title & excerpt */}
                    <div className="space-y-2">
                      <h3 className="text-base font-extrabold text-white group-hover:text-purple-400 transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>

                  {/* Footer details tags, views, likes */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-900/60 text-[10px] font-bold text-zinc-500">
                    <div className="flex flex-wrap gap-1.5">
                      {(post.tags || []).slice(0, 2).map((t, idx) => (
                        <span key={idx} className="text-purple-400/80">#{t}</span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{post.views_count || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>{post.likes_count || 0}</span>
                      </span>
                    </div>
                  </div>

                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/20">
              <Sparkles className="h-8 w-8 text-purple-500/20 mx-auto mb-4" />
              <p className="text-zinc-500 italic text-sm">No blog posts found matching criteria.</p>
            </div>
          )}
        </main>

        {/* Right Column: Sidebar */}
        <aside className="lg:col-span-4 space-y-10">
          
          {/* Card 1: Newsletter */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Mail className="h-5 w-5" />
              <h3 className="text-sm font-extrabold text-white">Subscribe to Newsletter</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Get notified of my deep-dive build logs, architecture summaries, and open-source releases. Strictly technical, zero spam.
            </p>

            {newsletterSubscribed ? (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold">
                ✓ Check your inbox to confirm subscription!
              </div>
            ) : (
              <form onSubmit={handleSubscribeNewsletter} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="flex-1 rounded-xl border border-zinc-900 bg-zinc-950/80 py-2.5 px-4 text-xs text-zinc-200 outline-none focus:border-purple-500/40"
                />
                <button
                  type="submit"
                  disabled={submittingNewsletter}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Join
                </button>
              </form>
            )}
          </div>

          {/* Card 2: Most Read */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/30 p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-900 pb-2">
              Popular Articles
            </h3>

            <div className="space-y-4">
              {popularPosts.map((post, idx) => (
                <Link 
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="flex gap-3 group items-start"
                >
                  <span className="text-lg font-black text-zinc-800 group-hover:text-purple-500 transition-colors">
                    0{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 group-hover:text-purple-400 transition-colors leading-snug">
                      {post.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 mt-1 block font-semibold">{post.views_count} reads</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Card 3: Tag Cloud */}
          {allTags.length > 0 && (
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/30 p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-900 pb-2">
                Tag Cloud
              </h3>

              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer border ${
                      tag === selectedTag
                        ? 'border-purple-500 bg-purple-950/20 text-purple-400'
                        : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

        </aside>

      </div>

    </div>
  );
}

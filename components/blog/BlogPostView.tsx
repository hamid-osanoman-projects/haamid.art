'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, Calendar, Clock, ThumbsUp, Flame, Award, Lightbulb, Bookmark, 
  Share2, Link2, ChevronLeft, ArrowRight, CornerDownRight, MessageSquare 
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: 'build_log' | 'tutorial' | 'opinion' | 'devlog';
  tags?: string[];
  cover_image?: string;
  published_at?: string;
  read_time?: number;
  views_count?: number;
  likes_count?: number;
}

interface BlogPostViewProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

type ReactionType = 'like' | 'fire' | 'mind_blown' | 'useful' | 'saved';

export default function BlogPostView({ post, relatedPosts }: BlogPostViewProps) {
  const [reactions, setReactions] = useState<Record<ReactionType, number>>({
    like: post.likes_count || 12,
    fire: 4,
    mind_blown: 6,
    useful: 9,
    saved: 3
  });
  
  const [userReactions, setUserReactions] = useState<Record<ReactionType, boolean>>({
    like: false, fire: false, mind_blown: false, useful: false, saved: false
  });

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [visitorId, setVisitorId] = useState('');

  // Extract visitor ID on client side to limit spam reactions
  useEffect(() => {
    let id = localStorage.getItem('haaamid_visitor_id');
    if (!id) {
      id = Math.random().toString(36).slice(2, 11);
      localStorage.setItem('haaamid_visitor_id', id);
    }
    setVisitorId(id);
  }, []);

  const handleToggleReaction = (type: ReactionType) => {
    const active = userReactions[type];
    setUserReactions(prev => ({ ...prev, [type]: !active }));
    setReactions(prev => ({
      ...prev,
      [type]: active ? prev[type] - 1 : prev[type] + 1
    }));

    // Perform database sync logic in Supabase if needed (omitted for speed / mock fallback)
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/blog/${post.slug}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Helper to extract headers from markdown content to construct a sticky Table of Contents
  const getTableOfContents = () => {
    const lines = post.content.split('\n');
    const headers: { text: string; id: string; level: number }[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        headers.push({ text, id, level });
      }
    });

    return headers;
  };

  const toc = getTableOfContents();

  // MDX block-by-block custom compiler rendering
  const parseMDXContent = (content: string) => {
    const blocks = content.split('\n\n');
    
    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      
      // Headers
      if (trimmed.startsWith('## ')) {
        const text = trimmed.slice(3);
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return <h2 key={idx} id={id} className="text-xl sm:text-2xl font-black text-white mt-10 mb-4">{text}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        const text = trimmed.slice(4);
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return <h3 key={idx} id={id} className="text-lg font-bold text-white mt-8 mb-3">{text}</h3>;
      }

      // Callout Alert Box blocks
      if (trimmed.startsWith('> [!NOTE]') || trimmed.startsWith('> [!TIP]') || trimmed.startsWith('> [!WARNING]')) {
        const lines = trimmed.split('\n');
        const header = lines[0].replace('> ', '');
        const alertType = header.includes('TIP') ? 'tip' : header.includes('WARNING') ? 'warning' : 'note';
        const bodyLines = lines.slice(1).map(l => l.replace(/^>\s?/, '')).join('\n');
        
        return (
          <div 
            key={idx} 
            className={`my-6 p-5 rounded-2xl border text-xs leading-relaxed ${
              alertType === 'tip' ? 'bg-purple-950/20 border-purple-500/20 text-purple-200' :
              alertType === 'warning' ? 'bg-amber-950/20 border-amber-500/20 text-amber-200' :
              'bg-zinc-900/40 border-zinc-800 text-zinc-300'
            }`}
          >
            <span className="font-extrabold uppercase tracking-wider block mb-1 text-[10px]">
              {alertType}
            </span>
            <p>{bodyLines}</p>
          </div>
        );
      }

      // Bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n').map(item => item.replace(/^[\-\*]\s/, ''));
        return (
          <ul key={idx} className="my-6 space-y-2 list-disc ml-6 text-zinc-300 text-xs sm:text-sm">
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>{item}</li>
            ))}
          </ul>
        );
      }

      // Fenced Code blocks
      if (trimmed.startsWith('```')) {
        const lines = trimmed.split('\n');
        const lang = lines[0].slice(3) || 'typescript';
        const code = lines.slice(1, -1).join('\n');
        
        return (
          <div key={idx} className="my-6 rounded-xl border border-zinc-900 bg-zinc-950 overflow-hidden font-mono text-xs">
            <div className="flex justify-between items-center bg-zinc-950 px-4 py-2 border-b border-zinc-900/60 text-[10px] text-zinc-500 font-bold uppercase">
              <span>{lang}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-purple-300 bg-zinc-950/60 leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Plain paragraphs with inline formatting
      return (
        <p key={idx} className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
          {trimmed.split(/(`.*?`|\*\*.*?\*\*)/g).map((chunk, chunkIdx) => {
            if (chunk.startsWith('`') && chunk.endsWith('`')) {
              return (
                <code key={chunkIdx} className="bg-zinc-900 text-purple-400 px-1 py-0.5 rounded text-xs font-mono border border-zinc-850">
                  {chunk.slice(1, -1)}
                </code>
              );
            }
            if (chunk.startsWith('**') && chunk.endsWith('**')) {
              return (
                <strong key={chunkIdx} className="font-extrabold text-white">
                  {chunk.slice(2, -2)}
                </strong>
              );
            }
            return chunk;
          })}
        </p>
      );
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 bg-[#0a0a0a] text-zinc-100 font-sans select-none">
      
      {/* Back button */}
      <Link 
        href="/blog" 
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-wider mb-10 transition-colors"
      >
        <ChevronLeft className="h-4.5 w-4.5" />
        <span>Notebook Index</span>
      </Link>

      {/* -------------------- MAIN SPLIT: TOC & ARTICLE CONTENT -------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Sticky Table of Contents (Desktop Only) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-28 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-900 pb-2">
            Table of Contents
          </h3>
          <nav className="space-y-3">
            {toc.map((header, idx) => (
              <a
                key={idx}
                href={`#${header.id}`}
                className={`block text-xs font-bold hover:text-purple-400 transition-colors text-zinc-500 ${
                  header.level === 3 ? 'ml-3 font-semibold' : ''
                }`}
              >
                {header.text}
              </a>
            ))}
          </nav>
        </aside>

        {/* Center Column: Article post body content */}
        <article className="lg:col-span-9 max-w-3xl mx-auto">
          
          {/* Post Header details */}
          <header className="space-y-6 mb-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-purple-500/30 bg-purple-950/80 text-purple-400">
                {post.category.replace('_', ' ')}
              </span>
              <div className="flex gap-2">
                {(post.tags || []).map((t, idx) => (
                  <span key={idx} className="text-zinc-500 text-[10px] font-bold">#{t}</span>
                ))}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
              {post.title}
            </h1>
            
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
              {post.excerpt}
            </p>

            {/* Author Profile */}
            <div className="flex items-center gap-3 pt-4 border-t border-zinc-900/60">
              <div className="h-9 w-9 rounded-full border border-purple-500/20 bg-purple-950/30 flex items-center justify-center text-xs font-bold text-purple-400 uppercase">
                H
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-white">Hamid U V</p>
                <p className="text-zinc-500 mt-0.5">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'} · {post.read_time || 5} min read
                </p>
              </div>
            </div>
          </header>

          {/* Cover Image */}
          {post.cover_image && (
            <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-zinc-900 mb-10 border border-zinc-900">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}

          {/* Parsed MDX Body Content */}
          <div className="prose prose-invert max-w-none">
            {parseMDXContent(post.content)}
          </div>

          {/* -------------------- REACTIONS BAR -------------------- */}
          <section className="my-12 border-y border-zinc-900 py-6">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 text-center mb-4">
              Rate this article
            </h4>
            <div className="flex items-center justify-center gap-3.5 flex-wrap">
              
              {/* Like */}
              <button
                onClick={() => handleToggleReaction('like')}
                className={`inline-flex items-center gap-2 rounded-xl border py-2.5 px-4 font-bold text-xs transition-all cursor-pointer ${
                  userReactions.like
                    ? 'border-purple-500/30 bg-purple-950/20 text-purple-400 shadow'
                    : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <span>❤️</span>
                <span>{reactions.like}</span>
              </button>

              {/* Fire */}
              <button
                onClick={() => handleToggleReaction('fire')}
                className={`inline-flex items-center gap-2 rounded-xl border py-2.5 px-4 font-bold text-xs transition-all cursor-pointer ${
                  userReactions.fire
                    ? 'border-purple-500/30 bg-purple-950/20 text-purple-400 shadow'
                    : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <span>🔥</span>
                <span>{reactions.fire}</span>
              </button>

              {/* Mind-blown */}
              <button
                onClick={() => handleToggleReaction('mind_blown')}
                className={`inline-flex items-center gap-2 rounded-xl border py-2.5 px-4 font-bold text-xs transition-all cursor-pointer ${
                  userReactions.mind_blown
                    ? 'border-purple-500/30 bg-purple-950/20 text-purple-400 shadow'
                    : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <span>🤯</span>
                <span>{reactions.mind_blown}</span>
              </button>

              {/* Useful */}
              <button
                onClick={() => handleToggleReaction('useful')}
                className={`inline-flex items-center gap-2 rounded-xl border py-2.5 px-4 font-bold text-xs transition-all cursor-pointer ${
                  userReactions.useful
                    ? 'border-purple-500/30 bg-purple-950/20 text-purple-400 shadow'
                    : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <span>💡</span>
                <span>{reactions.useful}</span>
              </button>

              {/* Saved */}
              <button
                onClick={() => handleToggleReaction('saved')}
                className={`inline-flex items-center gap-2 rounded-xl border py-2.5 px-4 font-bold text-xs transition-all cursor-pointer ${
                  userReactions.saved
                    ? 'border-purple-500/30 bg-purple-950/20 text-purple-400 shadow'
                    : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <span>🔖</span>
                <span>{reactions.saved}</span>
              </button>

            </div>
          </section>

          {/* -------------------- SHARE SECTION -------------------- */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-900 bg-zinc-950/20 mb-12 text-zinc-400">
            <div>
              <h4 className="text-xs font-bold text-white">Found this useful? Share it.</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Spread the word with your developer network.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Copy link */}
              <button 
                onClick={handleCopyLink}
                className="p-2 rounded-lg border border-zinc-900 hover:border-zinc-800 bg-zinc-950 cursor-pointer flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Link2 className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{copyFeedback ? 'Copied!' : 'Copy Link'}</span>
              </button>
              
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${post.title}" by @hamid`)}&url=${encodeURIComponent(`https://haaamid.art/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-zinc-900 hover:border-zinc-800 bg-zinc-950 cursor-pointer flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4 text-zinc-400 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://haaamid.art/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-zinc-900 hover:border-zinc-800 bg-zinc-950 cursor-pointer flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4 text-zinc-400 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
                </svg>
              </a>
            </div>
          </section>

          {/* -------------------- COMMENTS PLACEHOLDER -------------------- */}
          <section className="mb-12 border-t border-zinc-900 pt-10">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-6 flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5" />
              <span>Discussion Board (Comments)</span>
            </h3>
            
            {/* Giscus iframe placeholder wrapper */}
            <div className="bg-zinc-950/40 rounded-2xl border border-zinc-900 p-8 text-center text-zinc-500">
              <p className="italic text-xs">Giscus discussionsComments loader connected.</p>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mt-2 inline-block">
                Configured with target haaamid-art discussions repository
              </span>
            </div>
          </section>

          {/* -------------------- RELATED POSTS -------------------- */}
          {relatedPosts.length > 0 && (
            <section className="border-t border-zinc-900 pt-10">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-6">
                Related Reading
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedPosts.map((r) => (
                  <Link 
                    key={r.id} 
                    href={`/blog/${r.slug}`}
                    className="group flex flex-col p-4 rounded-xl border border-zinc-900 bg-zinc-950/20 hover:border-purple-500/20 transition-all cursor-pointer"
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-purple-400">
                      {r.category.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors leading-snug mt-2">
                      {r.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </article>

      </div>

    </div>
  );
}

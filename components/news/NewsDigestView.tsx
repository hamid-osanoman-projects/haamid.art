'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Calendar, ExternalLink, Bookmark, Mail, Star, 
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle 
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  ai_summary: string;
  source: string;
  engagement: number;
  tags?: string[];
  digest_date: string;
}

interface NewsDigestViewProps {
  initialNews: NewsItem[];
}

export default function NewsDigestView({ initialNews }: NewsDigestViewProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  
  // Date tracking: today or picked date
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Bookmarks stored in local storage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('haaamid_bookmarked_news') || '[]');
    }
    return [];
  });

  // Newsletter subscribe form state
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleBookmark = (id: string) => {
    let nextBookmarks = [...bookmarkedIds];
    if (nextBookmarks.includes(id)) {
      nextBookmarks = nextBookmarks.filter(bId => bId !== id);
    } else {
      nextBookmarks.push(id);
    }
    setBookmarkedIds(nextBookmarks);
    localStorage.setItem('haaamid_bookmarked_news', JSON.stringify(nextBookmarks));
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    setSubscribeStatus(null);

    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setSubscribeStatus({ type: 'success', text: 'Subscribed successfully! Watch for your welcome email.' });
        setEmail('');
      } else {
        setSubscribeStatus({ type: 'error', text: 'Subscription failed. Resend key may be offline.' });
      }
    } catch (err) {
      setSubscribeStatus({ type: 'error', text: 'Network connection failed.' });
    } finally {
      setSubscribing(false);
    }
  };

  // Archive week browser lists
  const handleJumpDate = (offsetDays: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + offsetDays);
    const dateStr = curr.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    
    // In production we would query Supabase for news on dateStr (omitted for static caching/mock safety)
  };

  // Filter items matching selectedDate
  const currentNews = news.filter(item => item.digest_date === selectedDate);
  const displayNews = currentNews.length > 0 ? currentNews : news.slice(0, 5); // Fallback to list if date empty

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 bg-[#0a0a0a] text-zinc-100 font-sans select-none">
      
      {/* -------------------- HEADER TITLE -------------------- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-zinc-900">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-purple-400 bg-purple-950/30 px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/10">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Today in Dev</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            Today in Dev
          </h1>
          <p className="text-zinc-400 text-sm">
            Curated tech digests summarized daily by Hamid's AI agent.
          </p>
        </div>

        {/* Date picker controls */}
        <div className="flex items-center gap-3.5 bg-zinc-950/80 p-2 border border-zinc-900 rounded-2xl">
          <button 
            onClick={() => handleJumpDate(-1)}
            className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          
          <div className="flex items-center gap-2 text-xs font-bold text-white px-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span>{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <button 
            onClick={() => handleJumpDate(1)}
            disabled={selectedDate === new Date().toISOString().split('T')[0]}
            className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* -------------------- MAIN DISPLAY GRID -------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Top 5 Story Cards */}
        <main className="lg:col-span-8 space-y-6">
          {displayNews.map((item) => {
            const isBookmarked = bookmarkedIds.includes(item.id);
            return (
              <article 
                key={item.id}
                className="group rounded-2xl border border-zinc-900 bg-zinc-950/30 p-6 shadow-sm hover:border-purple-500/15 hover:shadow-2xl hover:shadow-purple-500/5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Source Pill & Bookmark */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-purple-500/30 bg-purple-950/80 text-purple-400">
                      {item.source}
                    </span>
                    <button
                      onClick={() => toggleBookmark(item.id)}
                      className={`p-1.5 rounded-lg hover:bg-zinc-900/60 transition-colors ${
                        isBookmarked ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title={isBookmarked ? 'Bookmarked' : 'Add to bookmarks'}
                    >
                      <Bookmark className="h-4 w-4 fill-current" />
                    </button>
                  </div>

                  {/* Title & Link */}
                  <h3 className="text-base font-extrabold text-white leading-snug">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{item.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-50 shrink-0" />
                    </a>
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-zinc-300 leading-relaxed font-normal bg-zinc-900/10 p-4 border border-zinc-900/40 rounded-xl italic">
                    "{item.ai_summary}"
                  </p>
                </div>

                {/* Footer stats & tags */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-900/60 text-[10px] font-bold text-zinc-500">
                  <div className="flex flex-wrap gap-1.5">
                    {(item.tags || []).map((t, idx) => (
                      <span key={idx} className="text-purple-400/80">#{t}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                    <Star className="h-3 w-3 text-amber-500 fill-current" />
                    <span>engagement: {item.engagement}</span>
                  </div>
                </div>

              </article>
            );
          })}
        </main>

        {/* Right Column: News Sidebar */}
        <aside className="lg:col-span-4 space-y-10">
          
          {/* Card 1: Newsletter */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Mail className="h-5 w-5" />
              <h3 className="text-sm font-extrabold text-white">Weekly News Roundup</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Join developers receiving this digest in their inbox every Monday morning.
            </p>

            {subscribeStatus?.type === 'success' ? (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                <span>Subscribed! Check email to confirm.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full rounded-xl border border-zinc-900 bg-zinc-950 py-2.5 px-4 text-xs text-zinc-200 outline-none focus:border-purple-500/40"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {subscribing ? 'Joining list...' : 'Subscribe'}
                </button>
                {subscribeStatus?.type === 'error' && (
                  <p className="text-[10px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{subscribeStatus.text}</span>
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Card 2: Saved Bookmarks */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/30 p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-900 pb-2">
              Bookmarks ({bookmarkedIds.length})
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {bookmarkedIds.length > 0 ? (
                news
                  .filter(item => bookmarkedIds.includes(item.id))
                  .map(item => (
                    <div key={item.id} className="text-xs">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-bold text-zinc-200 hover:text-purple-400 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </a>
                      <span className="text-[9px] text-zinc-500 mt-1 block font-semibold">{item.source}</span>
                    </div>
                  ))
              ) : (
                <p className="text-zinc-500 italic text-[11px] leading-relaxed">Bookmarked articles will appear here locally.</p>
              )}
            </div>
          </div>

        </aside>

      </div>

    </div>
  );
}

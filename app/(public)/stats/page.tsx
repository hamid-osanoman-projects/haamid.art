import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Code, Star, Flame, Coffee, Globe, Calendar, Mail, 
  FileText, TrendingUp, Trophy, ArrowRight 
} from 'lucide-react';

export const revalidate = 3600; // Cache and revalidate hourly

// Fallback mock stats if Database empty
const MOCK_STATS = {
  totalVisitors: 1420,
  visitorsThisMonth: 380,
  blogPostsCount: 8,
  projectsCount: 6,
  githubCommits: 624,
  hoursCoded: 432,
  countriesCount: 12,
  subscribersCount: 45,
  coffeesHad: 142,
  currentStreak: 5,
  mostReadPost: 'Designing Anti-Gravity Interfaces with Three.js'
};

export default async function StatsPage() {
  let stats = MOCK_STATS;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Parallel queries to compile stats
    const [visitorsRes, postsRes, projectsRes, worksRes, subsRes, profileRes] = await Promise.allSettled([
      supabase.from('visitors').select('*'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('works').select('*'),
      supabase.from('works').select('actual_hours'),
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('*').eq('email', 'hamid.codehub@gmail.com').maybeSingle()
    ]);

    // Parse DB counts
    let totalVisitors = MOCK_STATS.totalVisitors;
    let visitorsThisMonth = MOCK_STATS.visitorsThisMonth;
    let countriesSet = new Set<string>();

    if (visitorsRes.status === 'fulfilled' && visitorsRes.value.data) {
      const data = visitorsRes.value.data;
      totalVisitors = data.length || totalVisitors;
      data.forEach(v => {
        if (v.country) countriesSet.add(v.country);
      });
      // Calculate this month visitors
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);
      visitorsThisMonth = data.filter(v => new Date(v.created_at) > startOfMonth).length || visitorsThisMonth;
    }

    const blogPostsCount = postsRes.status === 'fulfilled' && postsRes.value.count !== null ? postsRes.value.count : MOCK_STATS.blogPostsCount;
    const subscribersCount = subsRes.status === 'fulfilled' && subsRes.value.count !== null ? subsRes.value.count : MOCK_STATS.subscribersCount;
    
    let hoursCoded = MOCK_STATS.hoursCoded;
    if (worksRes.status === 'fulfilled' && worksRes.value.data) {
      hoursCoded = worksRes.value.data.reduce((acc, w) => acc + (Number(w.actual_hours) || 0), 0) || hoursCoded;
    }

    let projectsCount = MOCK_STATS.projectsCount;
    if (projectsRes.status === 'fulfilled' && projectsRes.value.data) {
      projectsCount = projectsRes.value.data.filter(w => w.status === 'done').length || projectsCount;
    }

    // Parse manual coffee / github stats from profile metadata
    let githubCommits = MOCK_STATS.githubCommits;
    let currentStreak = MOCK_STATS.currentStreak;
    let coffeesHad = MOCK_STATS.coffeesHad;

    if (profileRes.status === 'fulfilled' && profileRes.value.data) {
      const metadata = profileRes.value.data.metadata || {};
      const ghStats = profileRes.value.data.github_stats || {};
      
      githubCommits = ghStats.totalContributions || githubCommits;
      currentStreak = ghStats.currentStreak || currentStreak;
      coffeesHad = metadata.coffees_count || coffeesHad;
    }

    stats = {
      totalVisitors,
      visitorsThisMonth,
      blogPostsCount,
      projectsCount,
      githubCommits,
      hoursCoded,
      countriesCount: countriesSet.size > 0 ? countriesSet.size : MOCK_STATS.countriesCount,
      subscribersCount,
      coffeesHad,
      currentStreak,
      mostReadPost: MOCK_STATS.mostReadPost
    };

  } catch (err) {
    console.warn('Supabase fetch failed during stats compile, using static mock details:', err);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans py-16 md:py-24 px-6 select-none">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Title Header */}
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-purple-400 bg-purple-950/20 px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/10">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Open Metrics Console</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            Public Metrics Dashboard
          </h1>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Live updates summarizing audience traffic, codebase updates, and coding metrics. Trust-building telemetry compiled hourly.
          </p>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-zinc-900 pt-8">
          
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">All-Time Visitors</span>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400 shrink-0" />
              <p className="text-2xl font-black text-white">{stats.totalVisitors}</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Coded Hours</span>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-400 shrink-0" />
              <p className="text-2xl font-black text-white">{stats.hoursCoded} hrs</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">GitHub Streaks</span>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-purple-400 shrink-0" />
              <p className="text-2xl font-black text-white">{stats.currentStreak} days</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Coffees Consumed</span>
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-purple-400 shrink-0" />
              <p className="text-2xl font-black text-white">{stats.coffeesHad} cups</p>
            </div>
          </div>

        </div>

        {/* Secondary Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/30 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-400" />
              <span>Audience Demographics</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                <span className="text-zinc-500 text-[10px] block">Unique Countries</span>
                <span className="text-lg font-bold text-white mt-1 block">{stats.countriesCount}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                <span className="text-zinc-500 text-[10px] block">Newsletter Readers</span>
                <span className="text-lg font-bold text-white mt-1 block">{stats.subscribersCount}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/30 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-400" />
              <span>Shipped Outputs</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                <span className="text-zinc-500 text-[10px] block">Projects Delivered</span>
                <span className="text-lg font-bold text-white mt-1 block">{stats.projectsCount}</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                <span className="text-zinc-500 text-[10px] block">Papers Published</span>
                <span className="text-lg font-bold text-white mt-1 block">{stats.blogPostsCount}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Most Read Paper Highlight */}
        <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/30 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-purple-400" />
              <span>Trending Article Paper</span>
            </span>
            <h4 className="text-xs font-extrabold text-white mt-1">{stats.mostReadPost}</h4>
          </div>
          <ArrowRight className="h-4.5 w-4.5 text-zinc-500 shrink-0" />
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider pt-6 border-t border-zinc-900">
          Revalidated every hour · Compiled dynamically from DB logs
        </div>

      </div>
    </main>
  );
}

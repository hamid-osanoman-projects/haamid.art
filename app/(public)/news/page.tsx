import React from 'react';
import { createClient } from '@supabase/supabase-js';
import NewsDigestView from '@/components/news/NewsDigestView';

// Default mock news items fallback data if Database empty
const MOCK_NEWS = [
  {
    id: 'n1',
    title: 'TypeScript 5.6 Released with Extended Type Checks',
    url: 'https://news.ycombinator.com/item?id=typescript56',
    ai_summary: 'TypeScript 5.6 introduces strict compiler validations to catch regex pattern checks and syntax mistakes at compilation. Features include upgraded diagnostic outputs for config files.',
    source: 'Hacker News',
    engagement: 382,
    tags: ['TypeScript', 'Compiler'],
    digest_date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'n2',
    title: 'Turbopack Production Compilation Benchmarks Outperform Vite',
    url: 'https://nextjs.org/blog/turbopack-benchmarks',
    ai_summary: 'Next.js 16 teams announced optimized compile metrics showing Turbopack compiling production builds 40% faster than classic webpack setups. Incremental dev updates loads in milliseconds.',
    source: 'Next.js Blog',
    engagement: 145,
    tags: ['Turbopack', 'Next.js'],
    digest_date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'n3',
    title: 'Supabase Launching Realtime Broadcast and Presence Channels v2',
    url: 'https://supabase.com/blog/realtime-v2',
    ai_summary: 'Supabase Realtime updates allow developers to sync mouse coordinates and active visitor sessions state with sub-10ms ping rates. The engine uses WebSockets clusters built on Elixir.',
    source: 'Supabase Blog',
    engagement: 298,
    tags: ['Supabase', 'Elixir'],
    digest_date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'n4',
    title: 'Tailwind CSS v4.0 is Now standard for Next.js App Router templates',
    url: 'https://dev.to/tailwind/v4-app-router',
    ai_summary: 'Tailwind v4 shifts all configurations to standard CSS stylesheet imports, eliminating custom tailwind.config.js files. The engine builds with native rust parsers resulting in 10x faster compiling.',
    source: 'Dev.to Webdev',
    engagement: 92,
    tags: ['Tailwind', 'CSS'],
    digest_date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'n5',
    title: 'Vercel Serverless Functions Introduce Edge Regions Failovers',
    url: 'https://vercel.com/blog/edge-failover',
    ai_summary: 'Vercel Edge functions now automatically reroute active traffic to nearby server zones if local datacenters go offline. This guarantees 99.99% runtime availability for client applications.',
    source: 'Vercel Blog',
    engagement: 124,
    tags: ['Vercel', 'EdgeRuntime'],
    digest_date: new Date().toISOString().split('T')[0]
  }
];

export default async function NewsDigestPage() {
  let newsList = MOCK_NEWS;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch news items sorted by engagement
    const { data, error } = await supabase
      .from('news_items')
      .select('*')
      .order('digest_date', { ascending: false })
      .order('engagement', { ascending: false });

    if (!error && data && data.length > 0) {
      newsList = data;
    }
  } catch (err) {
    console.warn('DB load failed in news digests, using mock fallbacks:', err);
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <NewsDigestView initialNews={newsList} />
    </div>
  );
}

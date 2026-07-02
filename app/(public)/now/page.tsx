import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { Clock, BookOpen, Compass, Code, Info, ArrowUpRight } from 'lucide-react';

export const revalidate = 3600; // Cache and revalidate hourly

// Mock fallback profile "now" parameters if database is offline/empty
const MOCK_NOW = {
  building: 'Refining anti-gravity particle shaders and compiling background tasks in Hamid OS.',
  learning: 'WebGPU shaders, mathematical lerping curves, and advanced Deno edge routing metrics.',
  reading: '“Designing with Sound” by Rob Fowler and technical RFCs for Next.js.',
  focus: 'Preparing premium asset releases for open-source React Three Fiber widgets.',
  updated_at: new Date().toISOString()
};

export default async function NowPage() {
  let nowData = MOCK_NOW;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch owner profile variables
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'hamid@haaamid.art')
      .maybeSingle();

    if (profile && profile.metadata?.now) {
      nowData = {
        building: profile.metadata.now.building || MOCK_NOW.building,
        learning: profile.metadata.now.learning || MOCK_NOW.learning,
        reading: profile.metadata.now.reading || MOCK_NOW.reading,
        focus: profile.metadata.now.focus || MOCK_NOW.focus,
        updated_at: profile.updated_at || new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn('DB load failed on now page compile, using default mock details:', err);
  }

  const updatedDate = new Date(nowData.updated_at).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans py-16 md:py-24 px-6 select-none flex flex-col justify-between">
      
      {/* -------------------- MAIN DISPLAY CARD -------------------- */}
      <div className="max-w-xl mx-auto w-full space-y-10">
        
        {/* Title Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white tracking-tight">/now</h1>
          <p className="text-zinc-400 text-xs">
            A snapshot of what I’m currently focused on. Updated occasionally.
          </p>
        </div>

        {/* Categories Block */}
        <div className="space-y-6 pt-4 border-t border-zinc-900">
          
          {/* Building */}
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Code className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Working On</h3>
              <p className="text-xs text-zinc-200 leading-relaxed font-normal">{nowData.building}</p>
            </div>
          </div>

          {/* Learning */}
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Compass className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Learning</h3>
              <p className="text-xs text-zinc-200 leading-relaxed font-normal">{nowData.learning}</p>
            </div>
          </div>

          {/* Reading */}
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Reading</h3>
              <p className="text-xs text-zinc-200 leading-relaxed font-normal">{nowData.reading}</p>
            </div>
          </div>

          {/* Current Focus */}
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Info className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Primary Focus</h3>
              <p className="text-xs text-zinc-200 leading-relaxed font-normal">{nowData.focus}</p>
            </div>
          </div>

        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider pt-6 border-t border-zinc-900">
          <Clock className="h-3.5 w-3.5" />
          <span>Last updated: {updatedDate}</span>
        </div>

      </div>

      {/* -------------------- FOOTER watermark -------------------- */}
      <footer className="max-w-xl mx-auto w-full text-center mt-12 pt-6 border-t border-zinc-900/60">
        <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
          This is a <a href="https://nownownow.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-0.5">/now page<ArrowUpRight className="h-2.5 w-2.5" /></a>. If you have your own site, you should make one too.
        </p>
      </footer>

    </main>
  );
}

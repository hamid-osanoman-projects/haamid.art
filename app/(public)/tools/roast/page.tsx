'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flame, Link as LinkIcon, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTracker } from '@/components/gamification/TrackerProvider';

export default function RoastMySitePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ roast: string, tips: string[] } | null>(null);
  const [error, setError] = useState('');
  const { triggerCustomAction } = useTracker();

  const handleRoast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    // Add protocol if missing
    let targetUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      targetUrl = 'https://' + url;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to roast');
      }

      setResult({ roast: data.roast, tips: data.tips });
      triggerCustomAction('site_roasted'); // +xp
    } catch (err: any) {
      setError(err.message || 'Something went wrong while compiling the roast.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center py-24 px-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full z-10 space-y-8">
        <Link 
          href="/tools" 
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-2 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <Flame className="h-8 w-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            AI Portfolio Roaster
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Submit your URL and let an unhinged, brutal AI Senior Engineer absolutely tear your codebase and design to shreds.
          </p>
        </div>

        <form onSubmit={handleRoast} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-2 pl-4 focus-within:border-rose-500/50 focus-within:ring-1 focus-within:ring-rose-500/50 transition-all shadow-xl">
            <LinkIcon className="h-5 w-5 text-zinc-500 mr-3" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. haaamid.art or github.com/username"
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-600 w-full"
              required
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="ml-2 bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4 text-rose-600" />
                  <span>Roast Me</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-rose-950/40 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-slide-in">
            {/* The Roast */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 text-zinc-800/20">
                <Flame className="h-32 w-32 -rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full mb-6">
                  Senior Dev Review
                </div>
                <p className="text-xl text-zinc-200 font-serif italic leading-relaxed">
                  "{result.roast}"
                </p>
              </div>
            </div>

            {/* The Tips */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-6 uppercase tracking-widest">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Actual Advice
              </h3>
              <ul className="space-y-4">
                {result.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-zinc-300 leading-relaxed text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

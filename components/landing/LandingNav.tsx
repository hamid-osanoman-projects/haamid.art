'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function LandingNav() {

  const openTerminal = () => {
    // Fire a global event that the single TerminalOverlay in layout.tsx listens to
    window.dispatchEvent(new CustomEvent('vibe:open-terminal'));
  };

  return (
    <nav className="relative flex w-full max-w-6xl items-center justify-between z-10">
      {/* Left — Brand */}
      <Link
        href="/"
        className="text-xl font-black tracking-widest text-white hover:opacity-85 transition-opacity shrink-0"
      >
        HAAAMID<span className="text-purple-500">.ART</span>
      </Link>

      {/* Center — Nav links (truly centered via absolute positioning) */}
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400 absolute left-1/2 -translate-x-1/2">
        <Link href="#work" className="hover:text-white transition-colors">Work</Link>
        <Link href="#about" className="hover:text-white transition-colors">About</Link>
        <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
        <Link href="/now" className="hover:text-white transition-colors">Now</Link>
        <Link href="/stats" className="hover:text-white transition-colors">Stats</Link>
        <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
        <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
      </div>

      {/* Right — Shell button */}
      <button
        onClick={openTerminal}
        title="Open CLI Shell (or press ` or type 'hamid')"
        className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/40 px-4 py-2 text-xs font-bold text-emerald-400 hover:border-emerald-500/40 hover:bg-zinc-900/60 hover:text-emerald-300 transition-all backdrop-blur-md shrink-0 cursor-pointer"
      >
        <span className="font-mono text-emerald-500 group-hover:text-emerald-300 transition-colors">
          &gt;_
        </span>
        {/* <span className="hidden sm:inline tracking-widest">Shell</span>  */}
      </button>
    </nav>
  );
}

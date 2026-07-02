'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the heavy R3F Canvas component with ssr: false
const Hero3D = dynamic(() => import('@/components/landing/Hero3D'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 -z-10 h-full w-full bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-zinc-500 text-xs font-semibold animate-pulse flex items-center gap-2 tracking-widest uppercase">
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
        Loading 3D Workspace...
      </div>
    </div>
  ),
});

export default function Hero3DWrapper() {
  return <Hero3D />;
}

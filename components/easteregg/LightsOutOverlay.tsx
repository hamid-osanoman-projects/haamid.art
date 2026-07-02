'use client';

import { useState, useEffect } from 'react';
import { Power } from 'lucide-react';
import { useTracker } from '@/components/gamification/TrackerProvider';

export default function LightsOutOverlay() {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const { triggerCustomAction } = useTracker();

  useEffect(() => {
    const handleToggle = () => {
      if (!active) triggerCustomAction('lights_out');
      setActive((prev) => !prev);
    };

    window.addEventListener('vibe:lightsout', handleToggle);
    return () => window.removeEventListener('vibe:lightsout', handleToggle);
  }, [active, triggerCustomAction]);

  useEffect(() => {
    if (!active) return;
    
    // Set initial position to center of screen
    setPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [active]);

  if (!active) return null;

  return (
    <>
      {/* 
        The darkness layer. 
        It covers the whole screen, but uses a radial gradient mask to punch a hole where the mouse is.
      */}
      <div 
        className="fixed inset-0 z-[100] pointer-events-none transition-opacity duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle 180px at ${pos.x}px ${pos.y}px, transparent 0%, rgba(0, 0, 0, 0.98) 100%)`,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      >
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle 250px at ${pos.x}px ${pos.y}px, transparent 0%, #000 100%)`
          }}
        />
      </div>

      {/* Emergency Power Switch to turn the lights back on */}
      <button
        onClick={() => setActive(false)}
        className="fixed top-6 right-6 z-[110] flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all cursor-pointer backdrop-blur-md"
      >
        <Power className="h-4 w-4" />
        <span className="text-xs font-bold font-mono uppercase tracking-widest">Restore Power</span>
      </button>
    </>
  );
}

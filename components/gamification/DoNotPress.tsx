'use client';

import React, { useState, useEffect } from 'react';
import { Skull, AlertTriangle, XCircle } from 'lucide-react';
import { useTracker } from '@/components/gamification/TrackerProvider';

export default function DoNotPress() {
  const [phase, setPhase] = useState(0);
  const { triggerCustomAction } = useTracker();

  useEffect(() => {
    if (phase === 0) return;

    if (phase === 1) {
      // Phase 1: Shake
      document.body.style.animation = 'shake 0.5s infinite';
      const t = setTimeout(() => setPhase(2), 2000);
      return () => clearTimeout(t);
    }
    
    if (phase === 2) {
      // Phase 2: Invert Gravity
      document.body.style.animation = '';
      document.body.style.transition = 'transform 2s ease-in-out, filter 2s ease-in-out';
      document.body.style.transform = 'rotate(180deg)';
      document.body.style.filter = 'invert(1) hue-rotate(180deg)';
      
      const t = setTimeout(() => setPhase(3), 3000);
      return () => clearTimeout(t);
    }

    if (phase === 3) {
      // Phase 3: Total CSS Chaos
      const chaosInterval = setInterval(() => {
        const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
        document.body.style.backgroundColor = randomColor;
        document.body.style.transform = `rotate(180deg) scale(${1 + Math.random() * 0.5})`;
      }, 200);
      
      const t = setTimeout(() => {
        clearInterval(chaosInterval);
        setPhase(4);
      }, 3000);
      
      return () => {
        clearInterval(chaosInterval);
        clearTimeout(t);
      };
    }
    
  }, [phase]);

  const triggerChaos = () => {
    if (phase > 0) return;
    triggerCustomAction('do_not_press');
    setPhase(1);
    
    // Ensure styles are added for shake animation
    if (!document.getElementById('chaos-styles')) {
      const style = document.createElement('style');
      style.id = 'chaos-styles';
      style.innerHTML = `
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
      `;
      document.head.appendChild(style);
    }
  };

  const resetEverything = () => {
    document.body.style.animation = '';
    document.body.style.transform = '';
    document.body.style.filter = '';
    document.body.style.backgroundColor = '';
    document.body.style.transition = '';
    setPhase(0);
    window.location.reload();
  };

  return (
    <>
      <div className="flex justify-center mt-20 mb-10 w-full relative group">
        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
        <button
          onClick={triggerChaos}
          className="relative overflow-hidden group cursor-pointer transition-transform hover:scale-110 active:scale-95"
        >
          <div className="bg-red-600 border-4 border-red-900 rounded-2xl p-6 shadow-[0_10px_0_0_#7f1d1d,0_15px_20px_rgba(0,0,0,0.5)] flex flex-col items-center gap-2 group-active:translate-y-2 group-active:shadow-[0_2px_0_0_#7f1d1d,0_5px_10px_rgba(0,0,0,0.5)] transition-all">
            <Skull className="h-10 w-10 text-white animate-pulse" />
            <span className="text-white font-black uppercase tracking-widest text-xl">Do Not Press</span>
          </div>
        </button>
      </div>

      {/* BSOD Overlay */}
      {phase === 4 && (
        <div 
          className="fixed inset-0 z-[999999] bg-[#0000AA] text-white p-12 font-mono flex flex-col justify-center overflow-hidden cursor-none"
          style={{ transform: 'rotate(180deg)' /* because body is flipped */ }}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white text-[#0000AA] px-4 py-1 inline-block font-bold text-2xl mb-8">
              Windows
            </div>
            
            <p className="text-xl">
              A fatal exception 0E has occurred at 0028:C0011E36 in UXD VMM(01) +<br/>
              00010E36. The current session will be terminated.
            </p>
            
            <ul className="list-none space-y-4 text-xl mt-8">
              <li className="flex items-start gap-4">
                <span className="shrink-0">*</span>
                <span>Press any key to terminate the current application.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="shrink-0">*</span>
                <span>Press CTRL+ALT+DEL again to restart your computer. You will<br/>lose any unsaved information in all applications.</span>
              </li>
            </ul>

            <div className="text-center mt-20">
              <button 
                onClick={resetEverything}
                className="animate-pulse cursor-pointer border border-white/50 px-6 py-2 hover:bg-white hover:text-[#0000AA]"
              >
                Press any key to continue _
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

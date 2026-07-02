'use client';

import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function PullStringToggle() {
  const [mounted, setMounted] = useState(false);
  const controls = useAnimation();
  const y = useMotionValue(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDragEnd = () => {
    if (y.get() > 50) {
      // Dispatch the lights out event
      window.dispatchEvent(new Event('vibe:lightsout'));
      
      // Play mechanical click
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } catch (e) {}
    }
    
    // Snap back
    controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 10 } });
  };

  if (!mounted) return null;

  return (
    <div className="fixed top-0 right-10 z-[100] flex flex-col items-center">
      {/* The string */}
      <motion.div 
        className="w-[2px] bg-neutral-600/50 dark:bg-neutral-400/50 origin-top"
        style={{ height: 100 }}
        animate={controls}
      />
      
      {/* The handle */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 100 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ y }}
        animate={controls}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.5)] cursor-grab active:cursor-grabbing -mt-1 flex items-center justify-center"
      >
        <div className="w-2 h-2 rounded-full bg-yellow-200" />
      </motion.div>
    </div>
  );
}

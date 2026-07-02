'use client';

import { useState, useEffect } from 'react';
import { useTracker } from '@/components/gamification/TrackerProvider';
import { Rotate3D } from 'lucide-react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a'
];

export default function Konami3DFlip() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);
  const { triggerCustomAction } = useTracker();

  // Listen for the Konami code
  useEffect(() => {
    if (isFlipped) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Get the key (handling both uppercase and lowercase for b/a)
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      
      const newSequence = [...sequence, key].slice(-10);
      setSequence(newSequence);

      // Check if it matches exactly
      if (newSequence.join(',') === KONAMI_CODE.join(',')) {
        setIsFlipped(true);
        setSequence([]);
        triggerCustomAction('konami_code');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sequence, isFlipped, triggerCustomAction]);

  // Apply the 3D flip effect to the body
  useEffect(() => {
    if (isFlipped) {
      // Prevent scrolling when flipped to keep it centered nicely
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Create a cool dark void behind the flipped body
      const originalHtmlBg = document.documentElement.style.background;
      document.documentElement.style.background = 'radial-gradient(circle at center, #1a1a2e 0%, #000000 100%)';
      document.documentElement.style.height = '100vh';
      
      // Apply 3D transforms
      document.body.style.transition = 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
      document.body.style.transformOrigin = 'center center';
      document.body.style.transform = 'perspective(2000px) rotateX(55deg) rotateZ(-35deg) scale(0.6) translateY(-10%)';
      document.body.style.boxShadow = '0 100px 200px -50px rgba(139, 92, 246, 0.4), 0 0 50px rgba(16, 185, 129, 0.2)';
      document.body.style.borderRadius = '24px';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.documentElement.style.background = originalHtmlBg;
        document.documentElement.style.height = '';
        document.body.style.transform = '';
        document.body.style.boxShadow = '';
        document.body.style.borderRadius = '';
      };
    }
  }, [isFlipped]);

  if (!isFlipped) return null;

  return (
    <div 
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500"
      style={{
        // Inverse transform to keep the exit button flat on screen!
        transform: 'perspective(2000px) rotateX(-55deg) rotateZ(35deg) scale(1.6)',
      }}
    >
      <button
        onClick={() => setIsFlipped(false)}
        className="flex items-center gap-3 px-6 py-3 rounded-full bg-purple-600/20 border border-purple-500/50 text-purple-300 font-mono font-bold tracking-widest text-sm hover:bg-purple-600 hover:text-white transition-all backdrop-blur-md shadow-2xl shadow-purple-900/50 cursor-pointer"
      >
        <Rotate3D className="h-5 w-5" />
        RESTORE DIMENSION
      </button>
    </div>
  );
}

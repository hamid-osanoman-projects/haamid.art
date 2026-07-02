'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useTracker } from '@/components/gamification/TrackerProvider';
import { Target } from 'lucide-react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a'
];

export default function KonamiLaser() {
  const [isActive, setIsActive] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);
  const { triggerCustomAction } = useTracker();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Listen for the Konami code
  useEffect(() => {
    if (isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const newSequence = [...sequence, key].slice(-10);
      setSequence(newSequence);

      if (newSequence.join(',') === KONAMI_CODE.join(',')) {
        setIsActive(true);
        setSequence([]);
        triggerCustomAction('konami_code');
        document.body.style.cursor = 'crosshair';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sequence, isActive, triggerCustomAction]);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Scorch marks array
    const scorchMarks: { x: number, y: number, radius: number }[] = [];

    const fireLaser = (e: MouseEvent) => {
      const targetX = e.clientX;
      const targetY = e.clientY;

      // Draw laser beam briefly
      ctx.beginPath();
      ctx.moveTo(window.innerWidth / 2, window.innerHeight); // Fire from bottom center
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;
      ctx.stroke();

      // Clear the laser after 50ms
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Redraw all previous scorch marks
        scorchMarks.forEach(mark => {
          drawScorch(mark.x, mark.y, mark.radius);
        });
      }, 50);

      // Add scorch mark
      const radius = Math.random() * 20 + 20;
      scorchMarks.push({ x: targetX, y: targetY, radius });
      drawScorch(targetX, targetY, radius);

      // Explosion particles using confetti
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { x: targetX / window.innerWidth, y: targetY / window.innerHeight },
        colors: ['#ff0000', '#ffa500', '#ffff00', '#111111'],
        zIndex: 10000
      });

      // Play laser sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (e) {}
    };

    const drawScorch = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#050505';
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 10;
      ctx.fill();
      
      // Inner glowing core
      ctx.beginPath();
      ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#111111';
      ctx.shadowBlur = 0;
      ctx.fill();
    };

    window.addEventListener('mousedown', fireLaser);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousedown', fireLaser);
      document.body.style.cursor = 'default';
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[9998] pointer-events-none"
      />
      <div className="fixed inset-0 z-[9997] pointer-events-none shadow-[inset_0_0_100px_rgba(255,0,0,0.2)]" />
      <button
        onClick={() => {
          setIsActive(false);
          document.body.style.cursor = 'default';
        }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3 rounded-full bg-red-600/20 border border-red-500/50 text-red-300 font-mono font-bold tracking-widest text-sm hover:bg-red-600 hover:text-white transition-all backdrop-blur-md shadow-2xl shadow-red-900/50 cursor-pointer"
      >
        <Target className="h-5 w-5" />
        CEASE FIRE
      </button>
    </>
  );
}

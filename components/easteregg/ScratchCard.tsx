'use client';

import { useEffect, useRef, useState } from 'react';

export default function ScratchCard({ children, width = 300, height = 150 }: { children: React.ReactNode, width?: number, height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Fill the canvas with a silver "scratch" coating
    ctx.fillStyle = '#a1a1aa'; // zinc-400
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some noise/texture to look like a real scratch card
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#d4d4d8' : '#71717a';
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
    
    // Draw "SCRATCH ME" text
    ctx.fillStyle = '#3f3f46'; // zinc-700
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2);
    
    let isDrawing = false;
    
    const scratch = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      checkScratched();
    };
    
    const checkScratched = () => {
      // Check how much is scratched off
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparentPixels = 0;
      
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255) {
          transparentPixels++;
        }
      }
      
      const percent = transparentPixels / (pixels.length / 4);
      if (percent > 0.5) {
        setIsScratched(true);
        // Fade out canvas
        canvas.style.transition = 'opacity 0.5s ease-out';
        canvas.style.opacity = '0';
        setTimeout(() => {
          canvas.style.pointerEvents = 'none';
        }, 500);
      }
    };
    
    const handleDown = () => { isDrawing = true; };
    const handleUp = () => { isDrawing = false; };
    
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', scratch);
    window.addEventListener('mouseup', handleUp);
    
    canvas.addEventListener('touchstart', handleDown);
    canvas.addEventListener('touchmove', scratch, { passive: false });
    window.addEventListener('touchend', handleUp);
    
    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', scratch);
      window.removeEventListener('mouseup', handleUp);
      canvas.removeEventListener('touchstart', handleDown);
      canvas.removeEventListener('touchmove', scratch);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);
  
  return (
    <div className="relative inline-block overflow-hidden rounded-xl" style={{ width, height }}>
      {/* The secret content underneath */}
      <div className="absolute inset-0 flex items-center justify-center p-4 bg-zinc-900 border border-zinc-800 text-center">
        {children}
      </div>
      
      {/* The scratchable overlay */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-crosshair z-10"
      />
    </div>
  );
}

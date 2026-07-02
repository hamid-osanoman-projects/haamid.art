'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, CheckCircle2, Palette } from 'lucide-react';

interface Point {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color: string;
  size: number;
}

const DEFAULT_POINTS: Point[] = [
  { id: '1', x: 20, y: 30, color: '#f43f5e', size: 50 }, // rose
  { id: '2', x: 80, y: 20, color: '#a855f7', size: 60 }, // purple
  { id: '3', x: 50, y: 80, color: '#06b6d4', size: 70 }, // cyan
];

export default function MeshGeneratorPage() {
  const [points, setPoints] = useState<Point[]>(DEFAULT_POINTS);
  const [activePoint, setActivePoint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Background string generation
  const generateBackground = () => {
    const bgImage = points.map(p => 
      `radial-gradient(circle at ${p.x}% ${p.y}%, ${p.color} 0%, transparent ${p.size}%)`
    ).join(', ');
    
    return `background-color: #000000;\nbackground-image: ${bgImage};`;
  };

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    setActivePoint(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePoint || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setPoints(prev => prev.map(p => 
      p.id === activePoint ? { ...p, x, y } : p
    ));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activePoint) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setActivePoint(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      `.mesh-bg {\n  ${generateBackground().replace(/\n/g, '\n  ')}\n}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateColor = (id: string, newColor: string) => {
    setPoints(prev => prev.map(p => p.id === id ? { ...p, color: newColor } : p));
  };

  const updateSize = (id: string, newSize: number) => {
    setPoints(prev => prev.map(p => p.id === id ? { ...p, size: newSize } : p));
  };

  const addPoint = () => {
    if (points.length >= 6) return;
    setPoints(prev => [...prev, {
      id: Math.random().toString(),
      x: 50,
      y: 50,
      color: '#3b82f6', // blue
      size: 50
    }]);
  };

  const removePoint = (id: string) => {
    if (points.length <= 1) return;
    setPoints(prev => prev.filter(p => p.id !== id));
  };

  const cssString = generateBackground();

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 py-24 px-6 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-8">
        
        <Link 
          href="/tools" 
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>

        <div className="space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 mb-2">
            <Palette className="h-8 w-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Premium Mesh Gradients
          </h1>
          <p className="text-zinc-400 max-w-2xl leading-relaxed">
            Drag the control points to construct complex, ambient, glassmorphism-ready CSS mesh backgrounds. 
            Fully responsive, no images required.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Interactive Canvas */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              ref={containerRef}
              className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 touch-none"
              style={{
                backgroundColor: '#000000',
                backgroundImage: points.map(p => 
                  `radial-gradient(circle at ${p.x}% ${p.y}%, ${p.color} 0%, transparent ${p.size}%)`
                ).join(', ')
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {points.map(p => (
                <div
                  key={p.id}
                  onPointerDown={(e) => handlePointerDown(p.id, e)}
                  className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-white/50 bg-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing backdrop-blur-sm hover:scale-125 transition-transform"
                  style={{ 
                    left: `${p.x}%`, 
                    top: `${p.y}%`,
                    boxShadow: `0 0 20px ${p.color}`
                  }}
                />
              ))}
            </div>

            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
              <span className="text-sm text-zinc-400 font-medium">Control Points: {points.length}/6</span>
              <button 
                onClick={addPoint}
                disabled={points.length >= 6}
                className="bg-white text-black px-4 py-2 text-sm font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-200"
              >
                + Add Point
              </button>
            </div>
          </div>

          {/* Controls & Export */}
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-900 pb-4">
                Edit Nodes
              </h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {points.map((p, i) => (
                  <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300">Node {i + 1}</span>
                      <button 
                        onClick={() => removePoint(p.id)}
                        disabled={points.length <= 1}
                        className="text-[10px] text-red-400 hover:underline disabled:opacity-30"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={p.color} 
                        onChange={(e) => updateColor(p.id, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input 
                        type="range" 
                        min="10" 
                        max="150" 
                        value={p.size}
                        onChange={(e) => updateSize(p.id, parseInt(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Export */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 relative group">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex justify-between items-center">
                <span>CSS Output</span>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </h3>
              
              <pre className="text-[10px] sm:text-xs font-mono text-zinc-300 bg-zinc-900 p-4 rounded-xl overflow-x-auto border border-zinc-800">
                <code>
                  {`.mesh-bg {\n  ${cssString.replace(/\\n/g, '\n  ')}\n}`}
                </code>
              </pre>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useTracker } from '@/components/gamification/TrackerProvider';

const BLOCKS = [
  { name: 'React', shape: 'circle', w: 70, h: 70, color: 'bg-cyan-500', border: 'border-cyan-300', text: 'text-cyan-950', density: 0.05, bounce: 0.8 },
  { name: 'Tailwind', shape: 'rect', w: 140, h: 40, color: 'bg-sky-400', border: 'border-sky-200', text: 'text-sky-950', density: 0.01, bounce: 0.2 },
  { name: 'Postgres', shape: 'rect', w: 90, h: 90, color: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-white', density: 0.2, bounce: 0.1 },
  { name: 'Node.js', shape: 'rect', w: 70, h: 70, color: 'bg-green-500', border: 'border-green-300', text: 'text-green-950', density: 0.05, bounce: 0.3 },
  { name: 'Next.js', shape: 'rect', w: 50, h: 120, color: 'bg-zinc-200', border: 'border-white', text: 'text-black', density: 0.08, bounce: 0.2 },
];

export default function JengaPlayground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  
  const [maxHeight, setMaxHeight] = useState(0);
  const [nextBlockIdx, setNextBlockIdx] = useState(0);
  const [blocksTick, setBlocksTick] = useState(0);
  
  const blocksRef = useRef<Map<string, { data: typeof BLOCKS[0], body: Matter.Body }>>(new Map());
  const floorYRef = useRef(0);
  const aimXRef = useRef(window.innerWidth / 2);
  const [aimX, setAimX] = useState(window.innerWidth / 2);

  const spawnNextType = useCallback(() => {
    setNextBlockIdx(Math.floor(Math.random() * BLOCKS.length));
  }, []);

  const { triggerCustomAction } = useTracker();

  useEffect(() => {
    triggerCustomAction('played_jenga');
    spawnNextType();
  }, [spawnNextType, triggerCustomAction]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    engine.world.gravity.y = 1;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const thickness = 100;
    
    // We want a solid floor that they build on
    const floorY = h - 100;
    floorYRef.current = floorY - thickness / 2;
    
    const floor = Matter.Bodies.rectangle(w / 2, floorY, w, thickness, { isStatic: true, friction: 1, restitution: 0 });
    const leftWall = Matter.Bodies.rectangle(0 - thickness / 2, h / 2, thickness, h, { isStatic: true, friction: 0 });
    const rightWall = Matter.Bodies.rectangle(w + thickness / 2, h / 2, thickness, h, { isStatic: true, friction: 0 });
    
    Matter.World.add(engine.world, [floor, leftWall, rightWall]);

    // Height calculation loop
    let lastHeightUpdate = 0;
    Matter.Events.on(engine, 'afterUpdate', () => {
      let highestY = floorYRef.current;
      const now = Date.now();
      
      // Only update React state 10 times a second max to prevent lag
      if (now - lastHeightUpdate > 100) {
        blocksRef.current.forEach(({ body }) => {
          // If body is resting (velocity very low)
          if (body.speed < 0.5) {
            // Adjust highest Y
            // Body position is its center, so we subtract half its height/width roughly to get its top edge
            const topEdge = body.bounds.min.y;
            if (topEdge < highestY) highestY = topEdge;
          }
        });
        
        // Convert to meters (assuming 50px = 1m)
        const currentHeightMeters = Math.max(0, (floorYRef.current - highestY) / 50);
        setMaxHeight(currentHeightMeters);
        lastHeightUpdate = now;
      }
    });

    const mouse = Matter.Mouse.create(containerRef.current);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Matter.World.add(engine.world, mouseConstraint);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    let animationFrameId: number;
    const renderLoop = () => {
      blocksRef.current.forEach(({ body }, id) => {
        const el = document.getElementById(`block-${id}`);
        if (el) {
          el.style.transform = `translate(${body.position.x}px, ${body.position.y}px) rotate(${body.angle}rad)`;
        }
      });
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, []);

  // Aiming
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      aimXRef.current = e.clientX;
      setAimX(e.clientX);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Drop
  const handleDrop = useCallback(() => {
    if (!engineRef.current) return;
    
    const x = aimXRef.current;
    const y = 80;
    const blockData = BLOCKS[nextBlockIdx];
    const id = Math.random().toString(36).substring(2, 9);
    
    let body;
    if (blockData.shape === 'circle') {
      body = Matter.Bodies.circle(x, y, blockData.w / 2, {
        restitution: blockData.bounce,
        friction: 0.8,
        density: blockData.density,
      });
    } else {
      body = Matter.Bodies.rectangle(x, y, blockData.w, blockData.h, {
        restitution: blockData.bounce,
        friction: 0.8,
        density: blockData.density,
      });
    }

    Matter.World.add(engineRef.current.world, body);
    blocksRef.current.set(id, { data: blockData, body });
    setBlocksTick(t => t + 1); // trigger render

    spawnNextType();
  }, [nextBlockIdx, spawnNextType]);

  const restartGame = () => {
    if (!engineRef.current) return;
    const bodies = Array.from(blocksRef.current.values()).map(b => b.body);
    Matter.World.remove(engineRef.current.world, bodies);
    blocksRef.current.clear();
    setMaxHeight(0);
    setBlocksTick(t => t + 1);
  };

  const nextBlock = BLOCKS[nextBlockIdx];

  return (
    <div 
      className="fixed inset-0 bg-[#050505] overflow-hidden text-zinc-100 font-sans select-none cursor-crosshair" 
      ref={containerRef}
      onClick={handleDrop}
    >
      
      {/* Visual Floor */}
      <div 
        className="absolute left-0 w-full bg-zinc-900 border-t border-zinc-700 pointer-events-none"
        style={{ top: 'calc(100vh - 150px)', height: '150px' }}
      >
        <div className="w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex items-start justify-between z-50 pointer-events-none">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <Link href="/tools" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-2xl min-w-[150px]">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Tower Height</p>
            <p className="text-4xl font-black text-amber-400">
              {maxHeight.toFixed(1)}<span className="text-lg text-amber-600/50">m</span>
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); restartGame(); }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700 text-sm font-mono"
          >
            <RotateCcw className="h-4 w-4" /> Clear Tower
          </button>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-2xl flex flex-col items-center min-w-[150px]">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-4">Next Block</p>
            <div className="h-[120px] w-full flex items-center justify-center">
              <div 
                className={`flex items-center justify-center font-black border-2 shadow-xl ${nextBlock?.color} ${nextBlock?.border} ${nextBlock?.text} ${nextBlock?.shape === 'circle' ? 'rounded-full' : 'rounded-xl'}`}
                style={{
                  width: nextBlock?.w,
                  height: nextBlock?.h,
                  fontSize: Math.max(10, Math.min(nextBlock?.w, nextBlock?.h) * 0.4),
                  transform: 'scale(0.8)',
                }}
              >
                {nextBlock?.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aim Line */}
      <div 
        className="absolute top-[50px] bottom-[150px] border-l-2 border-dashed border-white/10 z-0 pointer-events-none transition-transform duration-75"
        style={{ transform: `translateX(${aimX}px)` }}
      />

      {/* Physics Blocks Rendering */}
      {Array.from(blocksRef.current.entries()).map(([id, { data }]) => (
        <div
          key={id}
          id={`block-${id}`}
          className={`
            absolute top-0 left-0 flex items-center justify-center font-black border-2 shadow-2xl
            ${data.color} ${data.border} ${data.text}
            ${data.shape === 'circle' ? 'rounded-full' : 'rounded-xl'}
          `}
          style={{
            width: data.w,
            height: data.h,
            marginTop: -data.h / 2,
            marginLeft: -data.w / 2,
            fontSize: Math.max(10, Math.min(data.w, data.h) * 0.4),
            willChange: 'transform',
          }}
        >
          {data.name}
        </div>
      ))}

    </div>
  );
}

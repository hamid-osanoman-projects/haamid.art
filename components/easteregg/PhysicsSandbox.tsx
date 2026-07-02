'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { ArrowLeft, RotateCcw, Bomb, Snowflake, CircleDashed, Hammer } from 'lucide-react';
import Link from 'next/link';
import { useTracker } from '@/components/gamification/TrackerProvider';

type Tool = 'bouncy' | 'ice' | 'anvil' | 'bomb';

const TOOLS = [
  { id: 'bouncy', name: 'Bouncy Ball', icon: CircleDashed, color: 'text-amber-400', bg: 'bg-amber-400/20' },
  { id: 'ice', name: 'Ice Block', icon: Snowflake, color: 'text-cyan-400', bg: 'bg-cyan-400/20' },
  { id: 'anvil', name: 'Heavy Anvil', icon: Hammer, color: 'text-zinc-400', bg: 'bg-zinc-400/20' },
  { id: 'bomb', name: 'Explosive', icon: Bomb, color: 'text-rose-500', bg: 'bg-rose-500/20' },
] as const;

export default function PhysicsSandbox() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  
  const [activeTool, setActiveTool] = useState<Tool>('bouncy');
  const [blocksTick, setBlocksTick] = useState(0);
  
  const blocksRef = useRef<Map<string, { type: Tool, body: Matter.Body }>>(new Map());
  const explosionsRef = useRef<{ id: string, x: number, y: number }[]>([]);
  
  const aimXRef = useRef(window.innerWidth / 2);
  const [aimX, setAimX] = useState(window.innerWidth / 2);
  
  const { triggerCustomAction } = useTracker();

  useEffect(() => {
    triggerCustomAction('played_sandbox');
  }, [triggerCustomAction]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    engine.world.gravity.y = 1;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const thickness = 100;
    
    const floor = Matter.Bodies.rectangle(w / 2, h + thickness / 2, w, thickness, { isStatic: true, friction: 1 });
    const leftWall = Matter.Bodies.rectangle(0 - thickness / 2, h / 2, thickness, h, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(w + thickness / 2, h / 2, thickness, h, { isStatic: true });
    
    Matter.World.add(engine.world, [floor, leftWall, rightWall]);

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
      
      // Clear old explosions visually
      const now = Date.now();
      explosionsRef.current = explosionsRef.current.filter(e => {
        const el = document.getElementById(`explosion-${e.id}`);
        if (el) {
          const age = now - parseInt(el.dataset.time || '0');
          if (age > 1000) return false;
        }
        return true;
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      aimXRef.current = e.clientX;
      setAimX(e.clientX);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const triggerExplosion = useCallback((bombId: string) => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    
    const bombData = blocksRef.current.get(bombId);
    if (!bombData) return; // already removed
    
    const { body } = bombData;
    const pos = { x: body.position.x, y: body.position.y };
    
    // Apply radial force to all bodies in world
    const blastRadius = 400;
    const forceMultiplier = 0.05;

    engine.world.bodies.forEach(b => {
      if (b === body || b.isStatic) return;
      const dx = b.position.x - pos.x;
      const dy = b.position.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < blastRadius && dist > 0) {
        const force = (blastRadius - dist) / blastRadius * forceMultiplier * b.mass;
        Matter.Body.applyForce(b, b.position, {
          x: (dx / dist) * force,
          y: (dy / dist) * force
        });
        
        // Add random torque
        Matter.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.5);
      }
    });

    // Remove bomb
    Matter.World.remove(engine.world, body);
    blocksRef.current.delete(bombId);
    
    // Record explosion for visual effect
    const expId = Math.random().toString(36).substr(2, 9);
    explosionsRef.current.push({ id: expId, x: pos.x, y: pos.y });
    
    setBlocksTick(t => t + 1); // trigger re-render
  }, []);

  const handleDrop = useCallback((e: React.MouseEvent) => {
    // Ignore clicks on UI
    if ((e.target as HTMLElement).closest('.ui-layer')) return;
    if (!engineRef.current) return;
    
    const x = e.clientX;
    const y = e.clientY;
    const id = Math.random().toString(36).substring(2, 9);
    
    let body;
    const blockSize = 60;

    if (activeTool === 'bouncy') {
      body = Matter.Bodies.circle(x, y, blockSize / 2, {
        restitution: 1.2, // bounces higher each time
        friction: 0.05,
        density: 0.05,
      });
    } else if (activeTool === 'ice') {
      body = Matter.Bodies.rectangle(x, y, blockSize, blockSize, {
        restitution: 0.2,
        friction: 0, // zero friction, extremely slippery
        frictionAir: 0.01,
        density: 0.05,
      });
    } else if (activeTool === 'anvil') {
      body = Matter.Bodies.rectangle(x, y, 80, 50, {
        restitution: 0,
        friction: 0.8,
        density: 2.0, // immensely heavy
      });
    } else if (activeTool === 'bomb') {
      body = Matter.Bodies.polygon(x, y, 8, blockSize / 2, {
        restitution: 0.5,
        friction: 0.5,
        density: 0.08,
      });
      
      // Schedule explosion
      setTimeout(() => {
        triggerExplosion(id);
      }, 2000);
    }

    if (body) {
      Matter.World.add(engineRef.current.world, body);
      blocksRef.current.set(id, { type: activeTool, body });
      setBlocksTick(t => t + 1);
    }
  }, [activeTool, triggerExplosion]);

  const restartGame = () => {
    if (!engineRef.current) return;
    const bodies = Array.from(blocksRef.current.values()).map(b => b.body);
    Matter.World.remove(engineRef.current.world, bodies);
    blocksRef.current.clear();
    setBlocksTick(t => t + 1);
  };

  return (
    <div 
      className="fixed inset-0 bg-[#050505] overflow-hidden text-zinc-100 font-sans select-none cursor-crosshair" 
      ref={containerRef}
      onClick={handleDrop}
    >
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex items-start justify-between z-50 pointer-events-none ui-layer">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <Link href="/tools" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <button
            onClick={restartGame}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700 text-sm font-mono mt-4"
          >
            <RotateCcw className="h-4 w-4" /> Clear All
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-3 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-2xl ui-layer pointer-events-auto">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as Tool)}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-xl transition-all min-w-[80px]
              ${activeTool === tool.id ? 'bg-zinc-800 scale-105 shadow-lg border border-zinc-700' : 'hover:bg-zinc-800/50 border border-transparent opacity-60 hover:opacity-100'}
            `}
          >
            <div className={`p-3 rounded-full ${tool.bg} ${tool.color}`}>
              <tool.icon className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase mt-1">{tool.name}</span>
          </button>
        ))}
      </div>

      {/* Physics Blocks Rendering */}
      {Array.from(blocksRef.current.entries()).map(([id, { type }]) => {
        if (type === 'bouncy') {
          return (
            <div key={id} id={`block-${id}`} className="absolute top-0 left-0 w-[60px] h-[60px] -ml-[30px] -mt-[30px] rounded-full bg-amber-400 border-4 border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.6)] will-change-transform" />
          );
        }
        if (type === 'ice') {
          return (
            <div key={id} id={`block-${id}`} className="absolute top-0 left-0 w-[60px] h-[60px] -ml-[30px] -mt-[30px] rounded-xl bg-cyan-400/50 backdrop-blur-sm border-2 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] will-change-transform flex items-center justify-center">
              <Snowflake className="h-6 w-6 text-cyan-200/50" />
            </div>
          );
        }
        if (type === 'anvil') {
          return (
            <div key={id} id={`block-${id}`} className="absolute top-0 left-0 w-[80px] h-[50px] -ml-[40px] -mt-[25px] rounded-sm bg-zinc-600 border-b-8 border-zinc-800 border-t-2 border-t-zinc-400 shadow-2xl will-change-transform flex items-center justify-center">
              <span className="text-[10px] font-black text-zinc-900 tracking-widest opacity-50">100 TONS</span>
            </div>
          );
        }
        if (type === 'bomb') {
          return (
            <div key={id} id={`block-${id}`} className="absolute top-0 left-0 w-[60px] h-[60px] -ml-[30px] -mt-[30px] rounded-full bg-zinc-900 border-4 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.8)] will-change-transform flex items-center justify-center animate-pulse">
              <Bomb className="h-8 w-8 text-rose-500" />
            </div>
          );
        }
        return null;
      })}

      {/* Explosions */}
      {explosionsRef.current.map(exp => (
        <div 
          key={exp.id}
          id={`explosion-${exp.id}`}
          data-time={Date.now()}
          className="absolute rounded-full border-4 border-rose-500/50 bg-rose-500/20 pointer-events-none animate-ping"
          style={{
            left: exp.x - 200,
            top: exp.y - 200,
            width: 400,
            height: 400,
            animationDuration: '1s',
            animationFillMode: 'forwards'
          }}
        />
      ))}

    </div>
  );
}

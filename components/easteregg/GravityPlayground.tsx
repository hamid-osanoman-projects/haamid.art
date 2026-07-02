'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useTracker } from '@/components/gamification/TrackerProvider';

const LEVELS = [
  { level: 0, name: 'HTML', radius: 15, color: 'bg-orange-500', text: 'text-orange-950', border: 'border-orange-400' },
  { level: 1, name: 'CSS', radius: 25, color: 'bg-blue-500', text: 'text-blue-950', border: 'border-blue-400' },
  { level: 2, name: 'JS', radius: 35, color: 'bg-yellow-400', text: 'text-yellow-950', border: 'border-yellow-300' },
  { level: 3, name: 'TS', radius: 45, color: 'bg-blue-600', text: 'text-white', border: 'border-blue-500' },
  { level: 4, name: 'React', radius: 60, color: 'bg-cyan-500', text: 'text-cyan-950', border: 'border-cyan-400' },
  { level: 5, name: 'Node', radius: 75, color: 'bg-green-600', text: 'text-white', border: 'border-green-500' },
  { level: 6, name: 'DB', radius: 95, color: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-400' },
  { level: 7, name: 'Next.js', radius: 120, color: 'bg-zinc-100', text: 'text-black', border: 'border-white' },
  { level: 8, name: 'Full-Stack', radius: 150, color: 'bg-purple-600', text: 'text-white', border: 'border-purple-400' },
];

export default function GravityPlayground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const { triggerCustomAction } = useTracker();
  
  const [score, setScore] = useState(0);
  const [nextBlockLvl, setNextBlockLvl] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // To avoid React state lag with 60fps physics, we use a ref map to track active blocks
  // and force a re-render only when blocks are added/removed.
  const [blocksTick, setBlocksTick] = useState(0); 
  const blocksRef = useRef<Map<number, { level: number, body: Matter.Body }>>(new Map());
  
  // Interaction state
  const mouseXRef = useRef(window.innerWidth / 2);
  const [aimX, setAimX] = useState(window.innerWidth / 2);
  const isDroppingRef = useRef(false);

  const spawnNextLevel = useCallback(() => {
    // Only spawn lvl 0, 1, or 2
    const rand = Math.random();
    if (rand < 0.6) setNextBlockLvl(0);
    else if (rand < 0.9) setNextBlockLvl(1);
    else setNextBlockLvl(2);
  }, []);

  useEffect(() => {
    spawnNextLevel();
  }, [spawnNextLevel]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // 1. Setup Engine
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    engine.world.gravity.y = 1;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const thickness = 60;

    const floor = Matter.Bodies.rectangle(w / 2, h + thickness / 2, w, thickness, { isStatic: true, friction: 0.5 });
    const leftWall = Matter.Bodies.rectangle(0 - thickness / 2, h / 2, thickness, h, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(w + thickness / 2, h / 2, thickness, h, { isStatic: true });
    
    Matter.World.add(engine.world, [floor, leftWall, rightWall]);

    // Track merges to avoid double-processing collisions
    const mergingPairs = new Set<string>();

    Matter.Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      const bodiesToRemove: Matter.Body[] = [];
      const bodiesToAdd: Matter.Body[] = [];
      let scoreIncrease = 0;

      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const levelA = bodyA.plugin.level;
        const levelB = bodyB.plugin.level;

        if (levelA !== undefined && levelB !== undefined && levelA === levelB) {
          // Ensure we haven't already processed this pair in this tick
          const pairId = bodyA.id < bodyB.id ? `${bodyA.id}-${bodyB.id}` : `${bodyB.id}-${bodyA.id}`;
          if (mergingPairs.has(pairId)) return;
          mergingPairs.add(pairId);

          if (levelA < LEVELS.length - 1) {
            const nextLevel = levelA + 1;
            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;

            const newBody = Matter.Bodies.circle(midX, midY, LEVELS[nextLevel].radius, {
              restitution: 0.2,
              friction: 0.5,
              density: 0.001 * (nextLevel + 1),
              plugin: { level: nextLevel }
            });

            bodiesToRemove.push(bodyA, bodyB);
            bodiesToAdd.push(newBody);
            
            scoreIncrease += (nextLevel * 10);
            
            if (nextLevel === LEVELS.length - 1) {
              triggerCustomAction('full_stack_suika');
            }
          }
        }
      });

      if (bodiesToRemove.length > 0) {
        Matter.World.remove(engine.world, bodiesToRemove);
        bodiesToRemove.forEach(b => blocksRef.current.delete(b.id));
        
        Matter.World.add(engine.world, bodiesToAdd);
        bodiesToAdd.forEach(b => blocksRef.current.set(b.id, { level: b.plugin.level, body: b }));
        
        setScore(s => s + scoreIncrease);
        setBlocksTick(t => t + 1); // trigger react render for new block
      }
      mergingPairs.clear();
    });

    // Check Game Over (danger line is at Y = 100)
    Matter.Events.on(engine, 'afterUpdate', () => {
      let over = false;
      blocksRef.current.forEach(({ body }) => {
        // If a body has settled and is above the danger line
        if (body.position.y < 100 && body.velocity.y > -0.1 && body.velocity.y < 0.1) {
          over = true;
        }
      });
      if (over) setGameOver(true);
    });

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // Render loop
    let animationFrameId: number;
    const renderLoop = () => {
      // Direct DOM manipulation for extreme performance
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
  }, [triggerCustomAction]);

  // Handle Mouse movement for aim
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;
      setAimX(e.clientX);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle Drop
  const handleDrop = useCallback(() => {
    if (gameOver || isDroppingRef.current || !engineRef.current) return;
    
    isDroppingRef.current = true;
    
    const x = mouseXRef.current;
    const y = 50; // Drop height
    const level = nextBlockLvl;
    const radius = LEVELS[level].radius;

    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.2,
      friction: 0.5,
      density: 0.001 * (level + 1),
      plugin: { level }
    });

    Matter.World.add(engineRef.current.world, body);
    blocksRef.current.set(body.id, { level, body });
    setBlocksTick(t => t + 1);

    spawnNextLevel();

    // Cooldown
    setTimeout(() => {
      isDroppingRef.current = false;
    }, 500); // 500ms cooldown between drops
  }, [gameOver, nextBlockLvl, spawnNextLevel]);

  const restartGame = () => {
    if (!engineRef.current) return;
    const bodies = Array.from(blocksRef.current.values()).map(b => b.body);
    Matter.World.remove(engineRef.current.world, bodies);
    blocksRef.current.clear();
    setScore(0);
    setGameOver(false);
    setBlocksTick(t => t + 1);
    spawnNextLevel();
  };

  return (
    <div 
      className="fixed inset-0 bg-[#050505] overflow-hidden text-zinc-100 font-sans select-none cursor-crosshair" 
      ref={containerRef}
      onClick={handleDrop}
    >
      {/* Danger Line */}
      <div className="absolute top-[100px] left-0 w-full border-b-2 border-dashed border-rose-500/30 z-0" />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex items-start justify-between z-50 pointer-events-none">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <Link href="/tools" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-2xl">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Score</p>
            <p className="text-4xl font-black text-emerald-400">{score}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-2xl flex flex-col items-center min-w-[120px]">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-4">Next Block</p>
            <div 
              className={`flex items-center justify-center font-black rounded-full border-2 ${LEVELS[nextBlockLvl]?.color} ${LEVELS[nextBlockLvl]?.border} ${LEVELS[nextBlockLvl]?.text}`}
              style={{
                width: LEVELS[nextBlockLvl]?.radius * 2,
                height: LEVELS[nextBlockLvl]?.radius * 2,
                fontSize: Math.max(10, LEVELS[nextBlockLvl]?.radius * 0.6),
              }}
            >
              {LEVELS[nextBlockLvl]?.name}
            </div>
          </div>
        </div>
      </div>

      {/* Aim Line */}
      {!gameOver && (
        <div 
          className="absolute top-[50px] bottom-0 border-l-2 border-dashed border-white/20 z-0 pointer-events-none transition-transform duration-75"
          style={{ transform: `translateX(${aimX}px)` }}
        />
      )}

      {/* Physics Blocks Rendering */}
      {Array.from(blocksRef.current.entries()).map(([id, { level }]) => (
        <div
          key={id}
          id={`block-${id}`}
          className={`
            absolute top-0 left-0 flex items-center justify-center font-black rounded-full border-2 shadow-2xl
            ${LEVELS[level].color} ${LEVELS[level].border} ${LEVELS[level].text}
          `}
          style={{
            width: LEVELS[level].radius * 2,
            height: LEVELS[level].radius * 2,
            // Offset margin to center the element on the transform coordinates
            marginTop: -LEVELS[level].radius,
            marginLeft: -LEVELS[level].radius,
            fontSize: Math.max(10, LEVELS[level].radius * 0.6),
            willChange: 'transform',
          }}
        >
          {LEVELS[level].name}
        </div>
      ))}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-rose-500 mb-2">STACK OVERFLOW</h2>
            <p className="text-zinc-400 mb-6">Your final score: <span className="text-emerald-400 font-bold text-xl">{score}</span></p>
            <button
              onClick={restartGame}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
            >
              <RotateCcw className="h-5 w-5" /> Try Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

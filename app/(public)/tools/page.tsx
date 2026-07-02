import type { Metadata } from 'next';
import Link from 'next/link';
import { Terminal, ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free Developer Tools',
  description: 'Free developer tools by Hamid U V — ASCII Art Generator and more.',
};

const TOOLS = [
  {
    href: '/tools/roast',
    icon: '🔥',
    title: 'AI Portfolio Roaster',
    description: 'Submit your portfolio URL and let an unhinged, brutal AI Senior Engineer absolutely tear your codebase and design to shreds (and give 3 real tips).',
    tag: 'AI Agent',
    color: 'rose',
  },
  {
    href: '/tools/mesh',
    icon: '🎨',
    title: 'Premium Mesh Gradients',
    description: 'Drag interactive control points to construct complex, ambient, glassmorphism-ready CSS mesh backgrounds. Instantly copy the CSS output.',
    tag: 'CSS Generator',
    color: 'indigo',
  },
  {
    href: '/tools/ascii',
    icon: '>_',
    title: 'ASCII Art Generator',
    description: 'Convert any image into character-based ASCII art. Adjustable resolution, 4 color themes, invert mode, copy & PNG export.',
    tag: 'Image Processing',
    color: 'purple',
  },
  {
    href: '/tools/hacker',
    icon: '</>',
    title: 'Mainframe Decryption (Hacker Screen)',
    description: 'A full-screen, high-speed code typing simulator. Open it, full-screen your browser, smash your keyboard, and look like a movie hacker at the coffee shop.',
    tag: 'Easter Egg',
    color: 'emerald',
  },
  {
    href: '/tools/gravity',
    icon: '🍉',
    title: 'DevMerge (Suika)',
    description: 'An addictive physics merge game. Drop tech stack blocks, combine them to upgrade (HTML -> CSS -> React -> Full Stack) without overflowing the container.',
    tag: 'Game',
    color: 'indigo',
  },
  {
    href: '/tools/jenga',
    icon: '🏗️',
    title: 'Tech Stack Jenga',
    description: 'Build the tallest possible tower using completely unstable tech stack blocks. Features live height tracking and bouncy React circles.',
    tag: 'Game',
    color: 'amber',
  },
  {
    href: '/tools/sandbox',
    icon: '💣',
    title: 'Ultimate Physics Sandbox',
    description: 'Pure chaotic fun. Spawn heavy anvils, zero-friction ice blocks, bouncy balls, and high-explosive bombs to mess with a custom physics engine.',
    tag: 'Toy',
    color: 'rose',
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 mb-3">
            haaamid.art / tools
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">
            Free Developer Tools
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            A small collection of browser-based tools I built for fun and utility.
            No backend, no tracking — just pure client-side utility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative flex flex-col gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:border-purple-500/40 hover:bg-zinc-900/60 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-mono text-purple-400 text-sm font-bold">
                  {tool.icon}
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-700 group-hover:text-purple-400 transition-colors" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100 mb-1">{tool.title}</h2>
                <p className="text-xs text-zinc-500 leading-relaxed">{tool.description}</p>
              </div>
              <span className="inline-flex w-fit text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {tool.tag}
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-[10px] font-mono text-zinc-700 text-center">
          Tip: Open the shell (press <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-500">` </kbd> or type <code className="text-emerald-500">ascii</code>) for quick access
        </p>
      </div>
    </div>
  );
}

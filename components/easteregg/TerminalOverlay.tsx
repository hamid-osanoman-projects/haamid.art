'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { useTracker } from '@/components/gamification/TrackerProvider';

interface LogLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

const COMMAND_LIST = ['whoami', 'skills', 'projects', 'contact', 'hire', 'blog', 'clear', 'exit', 'help', 'github', 'available', 'ascii', 'lightsout'];

interface TerminalOverlayProps {
  // Props kept for optional future use
  externalOpen?: boolean;
  onClose?: () => void;
}

export default function TerminalOverlay({ externalOpen, onClose }: TerminalOverlayProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState<LogLine[]>([
    { text: 'Hamid OS [Version 1.0.4]', type: 'success' },
    { text: "Type 'help' to see list of available commands. Press 'Esc' or type 'exit' to quit.", type: 'output' }
  ]);
  
  // Track consecutive typed keys to trigger 'hamid' sequence
  const [keySequence, setKeySequence] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { triggerCustomAction } = useTracker();

  // Sync with external open trigger (e.g. nav Shell button)
  useEffect(() => {
    if (externalOpen && !isOpen) {
      setIsOpen(true);
      triggerCustomAction('page_view');
    }
  }, [externalOpen]);

  // Listen for the global custom event fired by the >_ Shell nav button
  useEffect(() => {
    const handleOpenEvent = () => {
      if (!isOpen) {
        setIsOpen(true);
        triggerCustomAction('page_view');
      }
    };
    window.addEventListener('vibe:open-terminal', handleOpenEvent);
    return () => window.removeEventListener('vibe:open-terminal', handleOpenEvent);
  }, [isOpen]);

  // Close helper — notifies parent when closed
  const closeTerminal = () => {
    setIsOpen(false);
    onClose?.();
  };

  // 1. Listen to global keypresses to trigger overlay
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          closeTerminal();
        }
        return;
      }

      // Backtick trigger
      if (e.key === '`') {
        e.preventDefault();
        setIsOpen(true);
        triggerCustomAction('page_view');
        return;
      }

      // Consecutive sequence check for "hamid"
      const char = e.key.toLowerCase();
      if (char.length === 1 && /[a-z]/.test(char)) {
        const nextSeq = (keySequence + char).slice(-5);
        setKeySequence(nextSeq);

        if (nextSeq === 'hamid') {
          setIsOpen(true);
          setKeySequence('');
          triggerCustomAction('page_view');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, [isOpen, keySequence]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Scroll to bottom of terminal
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Append input log
    const nextLogs = [...logs, { text: `hamid@art:~$ ${cmd}`, type: 'input' as const }];
    
    // Log to analytics
    triggerCustomAction('command', { cmd });
    
    // Add to history
    const nextHistory = [...history, cmd];
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length);

    const parts = cmd.toLowerCase().split(' ');
    const primaryCmd = parts[0];

    let output = '';
    let outType: LogLine['type'] = 'output';

    switch (primaryCmd) {
      case 'help':
        output = `Available commands:\n  whoami      - Info about Hamid\n  skills      - Hamid's stack expertise\n  projects    - List recent works\n  contact     - Reach out to Hamid\n  hire        - Collaborate together\n  blog        - Share developer papers\n  github      - Launch Hamid's GitHub\n  available   - Retrieve work availability\n  ascii       - Open ASCII Art Generator\n  lightsout   - ???\n  clear       - Clear screen logs\n  exit        - Close OS terminal`;
        break;
      case 'whoami':
        output = 'Hamid U V — web & software developer specializing in anti-gravity, premium tactile interface designs. Based in Muscat, Oman. Available for remote freelance assignments.';
        break;
      case 'skills':
        output = 'Core: Next.js · React · TypeScript · Supabase · PostgreSQL · Tailwind CSS · Deno Edge · Node.js · Framer Motion · WebGL / Three.js · Figma';
        break;
      case 'projects':
        output = `Recent projects:\n  1. haaamid-art          [Next.js, Three.js] - Premium developer portfolio\n  2. anti-gravity-deck     [WebGL, Web Audio] - 3D tactile interface\n  3. supabase-cache-helper [PostgreSQL, Redis] - Realtime caches sync client`;
        break;
      case 'contact':
        output = 'Email: hamid@haaamid.art | Booking calendar: haaamid.art/contact';
        break;
      case 'hire':
        output = "Let's collaborate on fast, beautiful web products. Visit haaamid.art/contact to submit project specifications!";
        outType = 'success';
        break;
      case 'blog':
        output = 'Thoughts, design tutorials, and build logs on modern web engineering: haaamid.art/blog';
        break;
      case 'github':
        output = 'Launching GitHub profile...';
        if (typeof window !== 'undefined') window.open('https://github.com', '_blank');
        break;
      case 'ascii':
        output = '> Opening ASCII Art Generator... (rendering your portrait in characters)';
        outType = 'success';
        setTimeout(() => window.dispatchEvent(new CustomEvent('vibe:open-ascii')), 400);
        break;
      case 'lightsout':
        output = 'POWER GRID FAILURE DETECTED... Switching to emergency backup lighting.';
        outType = 'error';
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('vibe:lightsout'));
          closeTerminal();
        }, 1200);
        break;
      case 'available':
        output = 'Querying Supabase profiles status...\n Hamid is currently: AVAILABLE for freelance remote contracts.';
        outType = 'success';
        break;
      case 'clear':
        setLogs([]);
        setInputVal('');
        return;
      case 'exit':
        closeTerminal();
        setInputVal('');
        return;
      default:
        output = `Command not found: '${primaryCmd}'. Type 'help' for support.`;
        outType = 'error';
    }

    setLogs([...nextLogs, { text: output, type: outType }]);
    setInputVal('');
  };

  // Keyboard navigation inside console (Tab complete, history lookup)
  const handleInputKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const currentInput = inputVal.trim().toLowerCase();
      if (!currentInput) return;

      const matched = COMMAND_LIST.find(cmd => cmd.startsWith(currentInput));
      if (matched) {
        setInputVal(matched);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      
      const nextIdx = Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(history.length);
        setInputVal('');
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx] || '');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={() => inputRef.current?.focus()}
      className="fixed inset-0 z-50 bg-black/95 text-emerald-400 font-mono p-6 flex flex-col justify-between overflow-hidden select-text text-xs leading-relaxed"
    >
      {/* -------------------- RETRO SCANLINE & CRT SCREEN GLOW OVERLAYS -------------------- */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-20" />
      
      {/* Header logs container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-3.5 pr-2 scrollbar-none"
      >
        <div className="text-emerald-500 font-bold flex items-center gap-1.5 border-b border-emerald-950 pb-2 mb-4">
          <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>Hamid U V - CLI Shell Workspace [Online]</span>
        </div>

        {logs.map((log, i) => (
          <div 
            key={i} 
            className={`whitespace-pre-wrap ${
              log.type === 'input' 
                ? 'text-white' 
                : log.type === 'error' 
                  ? 'text-rose-400' 
                  : log.type === 'success' 
                    ? 'text-purple-400 font-bold' 
                    : 'text-emerald-400'
            }`}
          >
            {log.text}
          </div>
        ))}
      </div>

      {/* Input console footer */}
      <form 
        onSubmit={handleCommandSubmit}
        className="flex items-center gap-2 border-t border-emerald-950 pt-4"
      >
        <span className="text-emerald-500 font-bold shrink-0">hamid@art:~$</span>
        
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleInputKeydown}
          className="flex-1 bg-transparent border-none outline-none text-white font-mono caret-emerald-400 selection:bg-emerald-950"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {/* Floating cursor tracker */}
        <span className="h-3.5 w-2 bg-emerald-400 animate-pulse shrink-0" />
      </form>

    </div>
  );
}

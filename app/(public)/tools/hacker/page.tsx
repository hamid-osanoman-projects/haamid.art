'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal } from 'lucide-react';
import Link from 'next/link';

const HACKER_CODE = `/*
 * =========================================================
 *  MAINFRAME DECRYPTION PROTOCOL v3.1.0 - [AUTHOR: HAMID]
 * =========================================================
 *  STATUS: INITIALIZING KERNEL DRIVERS...
 *  MEMORY: ALLOCATED 0x00FF83B2
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { useTracker } from '@/components/gamification/TrackerProvider';

interface LogLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

const COMMAND_LIST = ['whoami', 'skills', 'projects', 'contact', 'hire', 'blog', 'clear', 'exit', 'help', 'github', 'available', 'ascii'];

export default function TerminalOverlay({ externalOpen, onClose }: TerminalOverlayProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [inputVal, setInputVal] = useState('');
  
  // Track consecutive typed keys to trigger 'hamid' sequence
  const [keySequence, setKeySequence] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { triggerCustomAction } = useTracker();

  // [CONNECTION ESTABLISHED]
  // BYPASSING FIREWALL...
  
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') closeTerminal();
        return;
      }

      // Backtick trigger
      if (e.key === '\`') {
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

  // INJECTING PAYLOAD... 0x1A2F99
  const handleCommand = async (cmd: string) => {
    const args = cmd.trim().split(' ').filter(Boolean);
    if (!args.length) return;
    const primaryCmd = args[0].toLowerCase();
    
    let output = '';
    let outType: LogLine['type'] = 'output';

    switch (primaryCmd) {
      case 'help':
        output = \`Available commands: whoami, skills, projects, contact, hire, blog, github, available, ascii, clear, exit\`;
        break;
      case 'whoami':
        output = 'Hamid U V — web & software developer specializing in anti-gravity, premium tactile interface designs.';
        break;
      case 'skills':
        output = '> React, Next.js, TypeScript, Node.js, Supabase, TailwindCSS, Gamification, Cybernetics';
        break;
      case 'sudo':
        output = 'ERROR: user is not in the sudoers file. This incident will be reported.';
        outType = 'error';
        break;
      default:
        output = \`Command not found: \${primaryCmd}\`;
        outType = 'error';
    }
  };
}

/*
 * SYSTEM OVERRIDE COMPLETE. 
 * ACCESS GRANTED.
 */
`;

export default function HackerMatrixPage() {
  const [charIndex, setCharIndex] = useState(0);
  const [autoTypeSpeed, setAutoTypeSpeed] = useState(15);
  const preRef = useRef<HTMLPreElement>(null);
  const codeLength = HACKER_CODE.length;

  // Auto-typing effect
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (charIndex < codeLength) {
      timeout = setTimeout(() => {
        setCharIndex((prev) => prev + Math.floor(Math.random() * 3) + 1);
      }, autoTypeSpeed);
    } else {
      // Loop it for endless fun
      timeout = setTimeout(() => setCharIndex(0), 5000);
    }
    return () => clearTimeout(timeout);
  }, [charIndex, autoTypeSpeed, codeLength]);

  // Keypress listener to type incredibly fast when user smashes keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling if they hit space or arrows, except Escape to go back
      if (['Space', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.code)) {
        e.preventDefault();
      }
      
      // Smash keyboard = jump characters
      setCharIndex((prev) => {
        const jump = Math.floor(Math.random() * 8) + 4; // Add 4-11 chars per keystroke
        return Math.min(prev + jump, codeLength);
      });
      
      // Speed up auto-type while they are active
      setAutoTypeSpeed(5);
    };

    const handleKeyUp = () => {
      // Slow back down
      setTimeout(() => setAutoTypeSpeed(35), 500);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [codeLength]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [charIndex]);

  const visibleCode = HACKER_CODE.substring(0, charIndex);
  
  // Progress bar calculation
  const progress = Math.floor((charIndex / codeLength) * 100);

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col font-mono text-emerald-500 selection:bg-emerald-500/30">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-500/20 bg-black/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase">Decryption Terminal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs opacity-70">
            [<span className="text-emerald-400">{progress}%</span>] DECRYPTING
          </span>
          <Link 
            href="/tools"
            className="text-emerald-500/60 hover:text-emerald-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
        <pre
          ref={preRef}
          className="text-[11px] sm:text-[13px] md:text-[14px] leading-relaxed tracking-wider whitespace-pre-wrap break-all"
          style={{ textShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}
        >
          {visibleCode}
          {charIndex < codeLength && (
            <span className="inline-block w-2.5 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle" />
          )}
        </pre>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5); 
        }
      `}} />
    </div>
  );
}

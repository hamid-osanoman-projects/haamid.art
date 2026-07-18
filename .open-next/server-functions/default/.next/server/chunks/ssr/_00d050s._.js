module.exports=[346058,(a,b,c)=>{"use strict";function d(a){if("function"!=typeof WeakMap)return null;var b=new WeakMap,c=new WeakMap;return(d=function(a){return a?c:b})(a)}c._=function(a,b){if(!b&&a&&a.__esModule)return a;if(null===a||"object"!=typeof a&&"function"!=typeof a)return{default:a};var c=d(b);if(c&&c.has(a))return c.get(a);var e={__proto__:null},f=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var g in a)if("default"!==g&&Object.prototype.hasOwnProperty.call(a,g)){var h=f?Object.getOwnPropertyDescriptor(a,g):null;h&&(h.get||h.set)?Object.defineProperty(e,g,h):e[g]=a[g]}return e.default=a,c&&c.set(a,e),e}},588644,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"InvariantError",{enumerable:!0,get:function(){return d}});class d extends Error{constructor(a,b){super(`Invariant: ${a.endsWith(".")?a:a+"."} This is a bug in Next.js.`,b),this.name="InvariantError"}}},739118,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0});var d={DEFAULT_SEGMENT_KEY:function(){return l},NOT_FOUND_SEGMENT_KEY:function(){return m},PAGE_SEGMENT_KEY:function(){return k},addSearchParamsIfPageSegment:function(){return i},computeSelectedLayoutSegment:function(){return j},getSegmentValue:function(){return f},getSelectedLayoutSegmentPath:function(){return function a(b,c,d=!0,e=[]){let g;if(d)g=b[1][c];else{let a=b[1];g=a.children??Object.values(a)[0]}if(!g)return e;let h=f(g[0]);return!h||h.startsWith(k)?e:(e.push(h),a(g,c,!1,e))}},isGroupSegment:function(){return g},isParallelRouteSegment:function(){return h}};for(var e in d)Object.defineProperty(c,e,{enumerable:!0,get:d[e]});function f(a){return Array.isArray(a)?a[1]:a}function g(a){return"("===a[0]&&a.endsWith(")")}function h(a){return a.startsWith("@")&&"@children"!==a}function i(a,b){if(a.includes(k)){let a=JSON.stringify(b);return"{}"!==a?k+"?"+a:k}return a}function j(a,b){if(!a||0===a.length)return null;let c="children"===b?a[0]:a[a.length-1];return c===l?null:c}let k="__PAGE__",l="__DEFAULT__",m="/_not-found"},554427,(a,b,c)=>{"use strict";function d(){let a,b,c=new Promise((c,d)=>{a=c,b=d});return{resolve:a,reject:b,promise:c}}Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"createPromiseWithResolvers",{enumerable:!0,get:function(){return d}})},932901,a=>{"use strict";var b=a.i(187924),c=a.i(572131),d=a.i(474215),e=a.i(357307),f=a.i(238246);let g=`/*
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
`;a.s(["default",0,function(){let[a,h]=(0,c.useState)(0),[i,j]=(0,c.useState)(15),k=(0,c.useRef)(null),l=g.length;(0,c.useEffect)(()=>{let b;return b=a<l?setTimeout(()=>{h(a=>a+Math.floor(3*Math.random())+1)},i):setTimeout(()=>h(0),5e3),()=>clearTimeout(b)},[a,i,l]),(0,c.useEffect)(()=>{let a=a=>{["Space","ArrowUp","ArrowDown","PageUp","PageDown"].includes(a.code)&&a.preventDefault(),h(a=>Math.min(a+(Math.floor(8*Math.random())+4),l)),j(5)},b=()=>{setTimeout(()=>j(35),500)};return window.addEventListener("keydown",a),window.addEventListener("keyup",b),()=>{window.removeEventListener("keydown",a),window.removeEventListener("keyup",b)}},[l]),(0,c.useEffect)(()=>{k.current&&(k.current.scrollTop=k.current.scrollHeight)},[a]);let m=g.substring(0,a),n=Math.floor(a/l*100);return(0,b.jsxs)("div",{className:"fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col font-mono text-emerald-500 selection:bg-emerald-500/30",children:[(0,b.jsxs)("div",{className:"flex items-center justify-between px-4 py-2 border-b border-emerald-500/20 bg-black/80 backdrop-blur-sm sticky top-0 z-10",children:[(0,b.jsxs)("div",{className:"flex items-center gap-3",children:[(0,b.jsx)(e.Terminal,{className:"h-4 w-4 animate-pulse"}),(0,b.jsx)("span",{className:"text-xs font-bold tracking-widest uppercase",children:"Decryption Terminal"})]}),(0,b.jsxs)("div",{className:"flex items-center gap-4",children:[(0,b.jsxs)("span",{className:"text-xs opacity-70",children:["[",(0,b.jsxs)("span",{className:"text-emerald-400",children:[n,"%"]}),"] DECRYPTING"]}),(0,b.jsx)(f.default,{href:"/tools",className:"text-emerald-500/60 hover:text-emerald-400 transition-colors",children:(0,b.jsx)(d.X,{className:"h-4 w-4"})})]})]}),(0,b.jsx)("div",{className:"flex-1 overflow-auto p-4 md:p-8 custom-scrollbar",children:(0,b.jsxs)("pre",{ref:k,className:"text-[11px] sm:text-[13px] md:text-[14px] leading-relaxed tracking-wider whitespace-pre-wrap break-all",style:{textShadow:"0 0 8px rgba(16, 185, 129, 0.4)"},children:[m,a<l&&(0,b.jsx)("span",{className:"inline-block w-2.5 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle"})]})}),(0,b.jsx)("style",{dangerouslySetInnerHTML:{__html:`
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
      `}})]})}])}];

//# sourceMappingURL=_00d050s._.js.map
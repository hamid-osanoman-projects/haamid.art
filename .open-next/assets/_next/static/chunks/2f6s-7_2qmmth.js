(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,195057,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={formatUrl:function(){return s},formatWithValidation:function(){return u},urlObjectKeys:function(){return i}};for(var o in n)Object.defineProperty(r,o,{enumerable:!0,get:n[o]});let a=e.r(190809)._(e.r(998183)),l=/https?|ftp|gopher|file/;function s(e){let{auth:t,hostname:r}=e,n=e.protocol||"",o=e.pathname||"",s=e.hash||"",i=e.query||"",u=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?u=t+e.host:r&&(u=t+(~r.indexOf(":")?`[${r}]`:r),e.port&&(u+=":"+e.port)),i&&"object"==typeof i&&(i=String(a.urlQueryToSearchParams(i)));let c=e.search||i&&`?${i}`||"";return n&&!n.endsWith(":")&&(n+=":"),e.slashes||(!n||l.test(n))&&!1!==u?(u="//"+(u||""),o&&"/"!==o[0]&&(o="/"+o)):u||(u=""),s&&"#"!==s[0]&&(s="#"+s),c&&"?"!==c[0]&&(c="?"+c),o=o.replace(/[?#]/g,encodeURIComponent),c=c.replace("#","%23"),`${n}${u}${o}${c}${s}`}let i=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function u(e){return s(e)}},818581,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useMergedRef",{enumerable:!0,get:function(){return o}});let n=e.r(271645);function o(e,t){let r=(0,n.useRef)(null),o=(0,n.useRef)(null);return(0,n.useCallback)(n=>{if(null===n){let e=r.current;e&&(r.current=null,e());let t=o.current;t&&(o.current=null,t())}else e&&(r.current=a(e,n)),t&&(o.current=a(t,n))},[e,t])}function a(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let r=e(t);return"function"==typeof r?r:()=>e(null)}}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},573668,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"isLocalURL",{enumerable:!0,get:function(){return a}});let n=e.r(718967),o=e.r(652817);function a(e){if(!(0,n.isAbsoluteUrl)(e))return!0;try{let t=(0,n.getLocationOrigin)(),r=new URL(e,t);return r.origin===t&&(0,o.hasBasePath)(r.pathname)}catch(e){return!1}}},284508,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"errorOnce",{enumerable:!0,get:function(){return n}});let n=e=>{}},522016,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={default:function(){return b},useLinkStatus:function(){return v}};for(var o in n)Object.defineProperty(r,o,{enumerable:!0,get:n[o]});let a=e.r(190809),l=e.r(843476),s=a._(e.r(271645)),i=e.r(195057),u=e.r(8372),c=e.r(818581),f=e.r(718967),d=e.r(405550);e.r(233525);let p=e.r(388540),h=e.r(91949),m=e.r(573668),y=e.r(509396);function b(t){var r,n;let o,a,b,[v,x]=(0,s.useOptimistic)(h.IDLE_LINK_STATUS),T=(0,s.useRef)(null),{href:w,as:S,children:k,prefetch:E=null,passHref:O,replace:C,shallow:j,scroll:R,onClick:L,onMouseEnter:I,onTouchStart:N,legacyBehavior:P=!1,onNavigate:_,transitionTypes:A,ref:M,unstable_dynamicOnHover:D,...U}=t;o=k,P&&("string"==typeof o||"number"==typeof o)&&(o=(0,l.jsx)("a",{children:o}));let K=s.default.useContext(u.AppRouterContext),q=!1!==E,B=!1!==E?null===(n=E)||"auto"===n?y.FetchStrategy.PPR:y.FetchStrategy.Full:y.FetchStrategy.PPR,F="string"==typeof(r=S||w)?r:(0,i.formatUrl)(r);if(P){if(o?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});a=s.default.Children.only(o)}let H=P?a&&"object"==typeof a&&a.ref:M,$=s.default.useCallback(e=>(null!==K&&(T.current=(0,h.mountLinkInstance)(e,F,K,B,q,x)),()=>{T.current&&((0,h.unmountLinkForCurrentNavigation)(T.current),T.current=null),(0,h.unmountPrefetchableInstance)(e)}),[q,F,K,B,x]),G={ref:(0,c.useMergedRef)($,H),onClick(t){P||"function"!=typeof L||L(t),P&&a.props&&"function"==typeof a.props.onClick&&a.props.onClick(t),!K||t.defaultPrevented||function(t,r,n,o,a,l,i){if("u">typeof window){let u,{nodeName:c}=t.currentTarget;if("A"===c.toUpperCase()&&((u=t.currentTarget.getAttribute("target"))&&"_self"!==u||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which)||t.currentTarget.hasAttribute("download"))return;if(!(0,m.isLocalURL)(r)){o&&(t.preventDefault(),location.replace(r));return}if(t.preventDefault(),l){let e=!1;if(l({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:f}=e.r(699781);s.default.startTransition(()=>{f(r,o?"replace":"push",!1===a?p.ScrollBehavior.NoScroll:p.ScrollBehavior.Default,n.current,i)})}}(t,F,T,C,R,_,A)},onMouseEnter(e){P||"function"!=typeof I||I(e),P&&a.props&&"function"==typeof a.props.onMouseEnter&&a.props.onMouseEnter(e),K&&q&&(0,h.onNavigationIntent)(e.currentTarget,!0===D)},onTouchStart:function(e){P||"function"!=typeof N||N(e),P&&a.props&&"function"==typeof a.props.onTouchStart&&a.props.onTouchStart(e),K&&q&&(0,h.onNavigationIntent)(e.currentTarget,!0===D)}};return(0,f.isAbsoluteUrl)(F)?G.href=F:P&&!O&&("a"!==a.type||"href"in a.props)||(G.href=(0,d.addBasePath)(F)),b=P?s.default.cloneElement(a,G):(0,l.jsx)("a",{...U,...G,children:o}),(0,l.jsx)(g.Provider,{value:v,children:b})}e.r(284508);let g=(0,s.createContext)(h.IDLE_LINK_STATUS),v=()=>(0,s.useContext)(g);("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},954962,e=>{"use strict";var t=e.i(843476),r=e.i(271645),n=e.i(263676),o=e.i(604139),a=e.i(522016);let l=`/*
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
`;e.s(["default",0,function(){let[e,s]=(0,r.useState)(0),[i,u]=(0,r.useState)(15),c=(0,r.useRef)(null),f=l.length;(0,r.useEffect)(()=>{let t;return t=e<f?setTimeout(()=>{s(e=>e+Math.floor(3*Math.random())+1)},i):setTimeout(()=>s(0),5e3),()=>clearTimeout(t)},[e,i,f]),(0,r.useEffect)(()=>{let e=e=>{["Space","ArrowUp","ArrowDown","PageUp","PageDown"].includes(e.code)&&e.preventDefault(),s(e=>Math.min(e+(Math.floor(8*Math.random())+4),f)),u(5)},t=()=>{setTimeout(()=>u(35),500)};return window.addEventListener("keydown",e),window.addEventListener("keyup",t),()=>{window.removeEventListener("keydown",e),window.removeEventListener("keyup",t)}},[f]),(0,r.useEffect)(()=>{c.current&&(c.current.scrollTop=c.current.scrollHeight)},[e]);let d=l.substring(0,e),p=Math.floor(e/f*100);return(0,t.jsxs)("div",{className:"fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col font-mono text-emerald-500 selection:bg-emerald-500/30",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between px-4 py-2 border-b border-emerald-500/20 bg-black/80 backdrop-blur-sm sticky top-0 z-10",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)(o.Terminal,{className:"h-4 w-4 animate-pulse"}),(0,t.jsx)("span",{className:"text-xs font-bold tracking-widest uppercase",children:"Decryption Terminal"})]}),(0,t.jsxs)("div",{className:"flex items-center gap-4",children:[(0,t.jsxs)("span",{className:"text-xs opacity-70",children:["[",(0,t.jsxs)("span",{className:"text-emerald-400",children:[p,"%"]}),"] DECRYPTING"]}),(0,t.jsx)(a.default,{href:"/tools",className:"text-emerald-500/60 hover:text-emerald-400 transition-colors",children:(0,t.jsx)(n.X,{className:"h-4 w-4"})})]})]}),(0,t.jsx)("div",{className:"flex-1 overflow-auto p-4 md:p-8 custom-scrollbar",children:(0,t.jsxs)("pre",{ref:c,className:"text-[11px] sm:text-[13px] md:text-[14px] leading-relaxed tracking-wider whitespace-pre-wrap break-all",style:{textShadow:"0 0 8px rgba(16, 185, 129, 0.4)"},children:[d,e<f&&(0,t.jsx)("span",{className:"inline-block w-2.5 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle"})]})}),(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:`
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
      `}})]})}])}]);
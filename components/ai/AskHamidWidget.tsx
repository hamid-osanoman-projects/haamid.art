'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, MessageSquare, Send, ArrowUpRight, HelpCircle, 
  Terminal, ShieldAlert, Loader2 
} from 'lucide-react';
import { useTracker } from '@/components/gamification/TrackerProvider';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

const QUICK_SUGGESTIONS = [
  { label: 'Is Hamid available?', query: 'Are you currently available for freelance work?' },
  { label: 'What are his tech skills?', query: 'What skills and technologies do you specialize in?' },
  { label: 'How much does he charge?', query: 'What is your pricing and rate structure?' }
];

export default function AskHamidWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'ai',
      text: "Hi! I am Hamid's AI assistant. Ask me anything about his developer background, skills, availability, or project pricing!"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const { triggerCustomAction } = useTracker();

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSendMessage = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    setErrorMsg('');
    const userMsgId = Math.random().toString();
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text }]);
    setInputVal('');
    setLoading(true);

    let fp = '';
    if (typeof window !== 'undefined') {
      fp = localStorage.getItem('haaamid_tracker_fingerprint') || 'fp_anonymous';
    }

    try {
      const res = await fetch('/api/ask-hamid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp, message: text })
      });

      const data = await res.json();
      
      if (res.status === 429) {
        setErrorMsg(data.reply || 'Daily limit reached.');
      } else if (res.ok && data.reply) {
        setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'ai', text: data.reply }]);
        // Award XP on successful reply
        triggerCustomAction('page_view');
      } else {
        setErrorMsg('Offline heuristic: could not retrieve response.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to assistant backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none text-xs">
      
      {/* -------------------- FLOATING COMPACT TRIGGER BUTTON -------------------- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-2xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          title="Ask Hamid's AI Assistant"
        >
          <Sparkles className="h-5.5 w-5.5 animate-pulse" />
        </button>
      )}

      {/* -------------------- EXPANDED CHAT CONSOLE SHEET -------------------- */}
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black/95 dark:backdrop-blur shadow-2xl flex flex-col overflow-hidden animate-slide-in">
          
          {/* Header */}
          <div className="bg-zinc-50 dark:bg-zinc-950 px-4 py-3 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                <Terminal className="h-3.5 w-3.5" />
                <span>Ask Hamid AI</span>
              </span>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages scroll content viewport */}
          <div className="flex-1 p-4 space-y-3.5 max-h-[300px] overflow-y-auto font-sans bg-zinc-900/5 select-text">
            {messages.map((m) => (
              <div 
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                  m.sender === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Blinking loader dots */}
            {loading && (
              <div className="flex justify-start">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-2xl rounded-bl-none flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-bounce" />
                  <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            {/* Error alerts */}
            {errorMsg && (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick clickable suggestions index */}
          {messages.length === 1 && !loading && (
            <div className="px-4 py-2 bg-zinc-50/50 dark:bg-zinc-950/30 border-t border-zinc-100 dark:border-zinc-900/60 space-y-1.5">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Quick Inquiries</p>
              <div className="flex flex-col gap-1">
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(s.query)}
                    className="text-left py-1 px-2.5 rounded bg-zinc-50 dark:bg-zinc-900 hover:bg-purple-950/20 hover:text-purple-400 border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-350 cursor-pointer flex items-center justify-between"
                  >
                    <span>{s.label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-40" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form input field footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputVal); }}
            className="p-3 border-t border-zinc-200 dark:border-zinc-900 flex gap-2 items-center bg-zinc-50 dark:bg-zinc-950"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask me a question..."
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 px-3 text-zinc-800 dark:text-zinc-200 outline-none"
            />
            
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}

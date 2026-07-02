'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function AskHamidWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hi! I'm an AI trained on Hamid's work. Ask me anything about his skills, experience, or availability!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check rate limit in localStorage (Max 10 questions per day)
    const today = new Date().toDateString();
    const storedCount = localStorage.getItem('ask_hamid_count');
    const storedDate = localStorage.getItem('ask_hamid_date');

    let count = storedDate === today ? parseInt(storedCount || '0', 10) : 0;
    if (count >= 10) {
      setMessages((prev) => [
        ...prev,
        { sender: 'user', text: input.trim() },
        { sender: 'ai', text: "You've reached your limit of 10 questions for today. Please feel free to reach out to Hamid directly using the contact form below!" }
      ]);
      setInput('');
      return;
    }

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // Send question to API route
      const response = await fetch('/api/ask-hamid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage })
      });

      const data = await response.json();

      if (response.ok && data.answer) {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.answer }]);
        // Update rate limit count
        localStorage.setItem('ask_hamid_count', (count + 1).toString());
        localStorage.setItem('ask_hamid_date', today);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: data.error || "Sorry, I ran into an error. Please try again or email Hamid directly." }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: "Network error. Please make sure you are online and try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed right-6 bottom-6 z-50 font-sans">
      {/* Expanded Chat Widget */}
      {isOpen && (
        <div className="absolute right-0 bottom-18 flex h-[480px] w-[350px] sm:w-[380px] flex-col rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl backdrop-blur-xl transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-950/20 text-purple-400">
                <Sparkles className="h-4 w-4" />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Ask Hamid (AI)</h3>
                <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Online · Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400 rounded-bl-none">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer Form */}
          <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me something..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 py-3 px-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200 focus:border-purple-500/50 focus:bg-zinc-900/80"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:pointer-events-none disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-900/30 hover:bg-purple-500 hover:shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all duration-250 z-50 cursor-pointer"
        aria-label="Toggle AI Chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the browser's default automatic mini-infobar
      e.preventDefault();
      // Stash the event so we can trigger it from our own button
      setDeferredPrompt(e);
      // Show our custom prompt banner
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Trigger the native browser installation popup
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the native prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    // We can only use the prompt once, so clear it out
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[100] bg-zinc-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-zinc-800 p-4 flex items-center justify-between animate-slide-up">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-zinc-100 truncate">Install NOOK</h4>
          <p className="text-[10px] text-zinc-400 truncate">Add to home screen</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Install
        </button>
        <button 
          onClick={() => setShowPrompt(false)}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

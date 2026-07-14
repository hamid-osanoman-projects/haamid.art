'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useTracker } from '@/components/gamification/TrackerProvider';

export default function VoiceController() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const { triggerCustomAction } = useTracker();

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript.toLowerCase();
          currentTranscript += text;
          
          if (event.results[i].isFinal) {
            handleCommand(text);
          }
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleCommand = (text: string) => {
    // Strip punctuation to make matching more reliable (e.g. "hey, hamid." -> "hey hamid")
    const cleanText = text.replace(/[.,!?]/g, '');
    
    if (cleanText.includes('turn off the lights') || cleanText.includes('lights out')) {
      triggerCustomAction('voice_lights_out');
      window.dispatchEvent(new CustomEvent('vibe:lightsout'));
      stopListening();
    } 
    else if (cleanText.includes('show me your projects') || cleanText.includes('go to work')) {
      triggerCustomAction('voice_scroll_work');
      const el = document.getElementById('work');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      stopListening();
    }
    else if (cleanText.includes('hey hamid') || cleanText.includes('open chat')) {
      triggerCustomAction('voice_open_chat');
      // Dispatch a custom event that AskHamidWidget could listen to.
      // But AskHamidWidget manages its own state internally currently.
      // A quick hack is to click the sparkle button if it exists.
      const chatBtn = document.querySelector(`button[title="Ask Hamid's AI Assistant"]`) as HTMLButtonElement;
      if (chatBtn) chatBtn.click();
      stopListening();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setTranscript('Listening for commands...');
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setTimeout(() => setTranscript(''), 2000);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2">
      <button
        onClick={toggleListening}
        className={`h-12 w-12 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all ${
          isListening 
            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse' 
            : 'bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-400'
        }`}
        title={isListening ? 'Stop listening' : 'Voice Control: Say "Hey Hamid" or "Turn off the lights"'}
      >
        {isListening ? (
          <Mic className="h-5 w-5" />
        ) : (
          <MicOff className="h-5 w-5" />
        )}
      </button>

      {transcript && isListening && (
        <div className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-[10px] px-3 py-1.5 rounded-full font-mono backdrop-blur-sm animate-fade-in max-w-[200px] truncate">
          {transcript}
        </div>
      )}
    </div>
  );
}

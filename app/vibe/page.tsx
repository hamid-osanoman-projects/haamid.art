'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { KeyRound, Loader2, Sparkles, Phone, Video, LogOut, BellRing } from 'lucide-react';
import CallNotification from '@/components/vibe/CallNotification';

interface Contact {
  id: string;
  name: string;
  avatar_emoji: string;
  avatar_color: string;
  relation: string;
  code: string;
}

interface ActiveRoom {
  id: string;
  room_name: string;
  type: 'call' | 'watch_party' | 'p2p_call';
  watch_url: string;
  display_name: string;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function VibePage() {
  const [code, setCode] = useState('');
  const [contact, setContact] = useState<Contact | null>(null);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');


  const supabase = createClient();



  // Check if contact already logged in from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('vibe_contact');
    if (stored) {
      try {
        const contactData = JSON.parse(stored);
        setContact(contactData);
        // Refresh token / check for active rooms
        checkActiveInvite(contactData.code, contactData.id);
      } catch (e) {
        localStorage.removeItem('vibe_contact');
      }
    }
    setIsPageLoading(false);

    if (typeof window !== 'undefined') {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushStatus('unsupported');
      } else if (Notification.permission === 'granted') {
        setPushStatus('granted');
      } else if (Notification.permission === 'denied') {
        setPushStatus('denied');
      }
    }
  }, []);

  // Set up online status heartbeat when logged in
  useEffect(() => {
    if (!contact) return;

    // Set online status in DB
    const updateOnlineStatus = async (online: boolean) => {
      await supabase
        .from('vibe_contacts')
        .update({ is_online: online, last_seen_at: new Date().toISOString() })
        .eq('id', contact.id);
    };

    updateOnlineStatus(true);

    // Heartbeat to keep online status active
    const heartbeat = setInterval(() => {
      updateOnlineStatus(true);
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      updateOnlineStatus(false);
    };
  }, [contact]);

  const checkActiveInvite = async (userCode: string, contactId: string) => {
    try {
      const res = await fetch('/api/vibe/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: userCode }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRoom(data.activeRoom);
        // If there's an active invite check if we should subscribe to push
        if (data.contact) {
          registerPushSubscription(data.contact.id);
        }
      }
    } catch (e) {
      console.warn('Failed to check active room status:', e);
    }
  };

  const registerPushSubscription = async (contactId: string) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn('VAPID public key not defined in environment variables.');
      return;
    }

    try {
      // Register service worker if not already registered
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }

      // Wait for it to be ready
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();

      if (!sub && Notification.permission === 'granted') {
        const convertedKey = urlBase64ToUint8Array(vapidKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
      }

      if (sub) {
        await fetch('/api/vibe/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId,
            subscription: sub.toJSON(),
            userAgent: navigator.userAgent
          })
        });
        setPushStatus('granted');
      }
    } catch (err) {
      console.warn('Failed to subscribe to Web Push:', err);
    }
  };

  const handleRequestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setPushStatus('granted');
      if (contact) {
        registerPushSubscription(contact.id);
      }
    } else {
      setPushStatus('denied');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/vibe/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        const contactInfo = { ...data.contact, code: code.trim() };
        localStorage.setItem('vibe_contact', JSON.stringify(contactInfo));
        setContact(contactInfo);
        setActiveRoom(data.activeRoom);

        // Prompt for notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          setTimeout(() => {
            handleRequestPushPermission();
          }, 1000);
        } else {
          registerPushSubscription(data.contact.id);
        }
      } else {
        setError(data.error || 'Access code not recognized');
        triggerShake();
      }
    } catch (err) {
      setIsLoading(false);
      setError('Connection failure. Try again.');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogout = async () => {
    if (contact) {
      // Update online status in DB
      await supabase
        .from('vibe_contacts')
        .update({ is_online: false })
        .eq('id', contact.id);
    }
    localStorage.removeItem('vibe_contact');
    setContact(null);
    setActiveRoom(null);
    setCode('');
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col justify-between p-6 relative overflow-hidden select-none">
      {/* Dynamic ambient lights */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-900/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">
            haaamid.art
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            Vibe
          </span>
        </div>
        {contact && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 max-w-md w-full mx-auto my-12">
        <AnimatePresence mode="wait">
          {!contact ? (
            /* ==================== LOGIN CODE ENTRY ==================== */
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="h-16 w-16 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto text-2xl animate-pulse">
                  🔮
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Hamid's Space</h2>
                <p className="text-xs text-zinc-400 leading-relaxed px-4">
                  A private hangout for friends & family. Enter the personal access code Hamid shared with you to join.
                </p>
              </div>

              <motion.form
                onSubmit={handleLogin}
                animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your invitation code..."
                    disabled={isLoading}
                    autoComplete="off"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/50 py-4 pr-4 pl-12 text-base text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 focus:border-purple-500/50 focus:bg-zinc-950/80"
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-400 font-semibold text-center mt-1">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !code.trim()}
                  className="w-full rounded-2xl bg-purple-600 hover:bg-purple-500 py-4 font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/30"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Enter Space</span>
                      <Sparkles className="h-4 w-4" />
                    </>
                  )}
                </button>
              </motion.form>
            </motion.div>
          ) : (
            /* ==================== WAITING ROOM SCREEN ==================== */
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full text-center space-y-8"
            >
              {/* Profile Avatar Card */}
              <div className="space-y-4">
                <div
                  className="h-28 w-28 rounded-full flex items-center justify-center text-5xl mx-auto shadow-2xl border-4 border-zinc-900/60"
                  style={{
                    backgroundColor: contact.avatar_color,
                    boxShadow: `0 10px 30px -10px ${contact.avatar_color}40`,
                  }}
                >
                  {contact.avatar_emoji}
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-zinc-100">Welcome, {contact.name}!</h2>
                  <div className="flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      Online & Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Banner for Active Invites */}
              <AnimatePresence>
                {activeRoom ? (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-emerald-300">Active Room Invite</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Hamid has started an active room: <strong className="text-zinc-200">{activeRoom.display_name}</strong>.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        window.location.href = activeRoom.type === 'watch_party'
                          ? `/vibe/watch/${activeRoom.id}`
                          : activeRoom.room_name.startsWith('p2p-') || activeRoom.type === 'p2p_call'
                          ? `/vibe/p2p-room/${activeRoom.id}`
                          : `/vibe/room/${activeRoom.id}`;
                      }}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 font-semibold text-white transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {activeRoom.type === 'watch_party' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                      <span>Join Live Room Now</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 rounded-2xl border border-zinc-900 bg-zinc-950/40 text-center space-y-3"
                  >
                    <div className="h-8 w-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mx-auto text-sm animate-pulse">
                      ☕
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Lobby stands ready. Keep this tab open on your device. When Hamid triggers a call, your phone will ring instantly.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Push permission status helper */}
              {pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
                <div className="pt-2">
                  <button
                    onClick={handleRequestPushPermission}
                    className="inline-flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/25 px-4 py-2.5 rounded-xl cursor-pointer"
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    <span>Enable Notification Ringing</span>
                  </button>
                  <p className="text-[9px] text-zinc-500 mt-1.5 px-6">
                    Allows calls to notify and ring your device even if you minimize this window.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="text-center z-10 text-[10px] text-zinc-600 tracking-wider uppercase py-2">
        {/* Footer text removed as requested */}
      </footer>

      {/* ==================== INCOMING CALL MODAL OVERLAY ==================== */}
      {contact && <CallNotification contactId={contact.id} />}
    </div>
  );
}

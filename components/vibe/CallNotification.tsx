'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface IncomingCall {
  roomId: string;
  roomName: string;
  type: 'call' | 'watch_party';
  message: string;
}

interface CallNotificationProps {
  contactId: string;
}

export default function CallNotification({ contactId }: CallNotificationProps) {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const supabase = createClient()
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Listen for incoming calls via Supabase Realtime broadcast
    const channel = supabase.channel('vibe:broadcast')
      .on('broadcast', { event: `call:${contactId}` }, ({ payload }) => {
        setIncomingCall(payload)
        
        // Vibrate phone
        if ('vibrate' in navigator) {
          navigator.vibrate([300, 100, 300, 100, 300])
        }
        
        // Play ring sound
        try {
          if (!ringtoneRef.current) {
            ringtoneRef.current = new Audio('/sounds/ringtone.mp3')
            ringtoneRef.current.loop = true
          }
          ringtoneRef.current.play().catch(() => {
            console.log('Ringtone autoplay prevented, waiting for user interaction.')
          })
        } catch (audioErr) {
          console.warn('Audio playback failed:', audioErr)
        }

        // Stop after 30 seconds
        setTimeout(() => {
          stopRingtone()
          setIncomingCall(null)
        }, 30000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      stopRingtone()
    }
  }, [contactId])

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
  }

  function joinCall() {
    if (!incomingCall) return
    stopRingtone()
    const path = incomingCall.type === 'watch_party'
      ? `/vibe/watch/${incomingCall.roomId}`
      : incomingCall.roomName.startsWith('p2p-') || incomingCall.type === 'p2p_call'
      ? `/vibe/p2p-room/${incomingCall.roomId}`
      : `/vibe/room/${incomingCall.roomId}`
    window.location.href = path
  }

  function declineCall() {
    stopRingtone()
    setIncomingCall(null)
  }

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#121212] border border-zinc-800/80 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl relative"
          >
            {/* Animated Ringing Halo */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="absolute inset-0 rounded-full bg-purple-500/20"
              />
              <div className="relative w-24 h-24 rounded-full bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-4xl shadow-inner">
                {incomingCall.type === 'watch_party' ? '⚽' : '📞'}
              </div>
            </div>

            <h3 className="text-zinc-100 font-extrabold text-xl mb-1">Hamid Calling</h3>
            <p className="text-zinc-400 text-xs mb-8 leading-relaxed">
              {incomingCall.message || 'Hamid is inviting you to a call.'}
            </p>

            {/* Call Controls */}
            <div className="flex gap-6 justify-center">
              <button
                onClick={declineCall}
                className="w-16 h-16 rounded-full bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600 hover:text-white text-rose-400 text-2xl flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-lg hover:shadow-rose-950/20"
              >
                📵
              </button>
              <button
                onClick={joinCall}
                className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-2xl hover:bg-emerald-500 transition-all duration-200 active:scale-95 cursor-pointer shadow-lg shadow-emerald-950/30 animate-bounce"
              >
                📞
              </button>
            </div>

            <p className="mt-6 text-[10px] text-zinc-500 uppercase tracking-widest">
              {incomingCall.type === 'watch_party' ? 'Watch Party Sync Invite' : 'Video Conference Invite'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

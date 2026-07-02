'use client'

import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { useState, useEffect } from 'react'

interface CallRoomProps {
  token: string
  livekitUrl: string
  roomId: string
  contact: any
  room: any
  isAdmin?: boolean
}

export default function CallRoom({ token, livekitUrl, roomId, contact, room, isAdmin = false }: CallRoomProps) {
  const [disconnected, setDisconnected] = useState(false)

  const handleDisconnect = () => {
    setDisconnected(true)
    // Auto-redirect after 3 seconds
    setTimeout(() => {
      window.location.href = isAdmin ? '/vibe/lobby' : '/vibe'
    }, 3000)
  }

  if (disconnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white gap-4">
        <div className="text-5xl animate-bounce">👋</div>
        <div className="text-xl font-semibold">Call ended</div>
        <div className="text-neutral-400 text-sm">
          {isAdmin
            ? 'Returning you to the admin lobby…'
            : `Thanks for joining, ${contact.name}!`}
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => window.location.href = isAdmin ? '/vibe/lobby' : '/vibe'}
            className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer border-none"
          >
            {isAdmin ? 'Back to Admin Lobby' : 'Back to Waiting Room'}
          </button>
        </div>
        <p className="text-[10px] text-neutral-600 mt-1">Redirecting automatically…</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#111111] relative">
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={handleDisconnect}
        data-lk-theme="default"
        style={{ height: '100dvh' }}
      >
        {/* Header bar */}
        <div className="absolute top-0 left-0 right-0 z-10 h-12 flex items-center justify-between px-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="text-white text-sm font-medium flex items-center gap-2">
            {room.display_name}
            {isAdmin && (
              <span className="text-[9px] font-bold uppercase tracking-widest bg-purple-600/30 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                Host
              </span>
            )}
          </div>
          <div
            style={{
              background: contact.avatar_color + '20',
              color: contact.avatar_color,
              borderColor: contact.avatar_color + '40'
            }}
            className="text-xs px-3 py-1 rounded-full border"
          >
            {contact.avatar_emoji} {contact.name}
          </div>
        </div>

        {/* Video grid */}
        <VideoConference />

        {/* Audio renderer (for remote audio) */}
        <RoomAudioRenderer />

        {/* Audio context unblocker for mobile browsers */}
        <AudioStartOverlay />
      </LiveKitRoom>
    </div>
  )
}

function AudioStartOverlay() {
  const room = useRoomContext()
  const [needsStart, setNeedsStart] = useState(false)

  useEffect(() => {
    if (!room) return
    if (!room.canPlaybackAudio) {
      setNeedsStart(true)
    }
  }, [room])

  if (!needsStart) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 gap-4">
      <div className="text-4xl animate-bounce">🔊</div>
      <h3 className="text-white text-lg font-bold">Audio Connection Paused</h3>
      <p className="text-zinc-400 text-xs max-w-xs leading-relaxed">
        Browsers require a tap gesture to enable remote audio streams on mobile. Tap below to activate audio.
      </p>
      <button
        onClick={async () => {
          await room.startAudio()
          setNeedsStart(false)
        }}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-lg active:scale-95 border-none"
      >
        Enable Audio Stream
      </button>
    </div>
  )
}

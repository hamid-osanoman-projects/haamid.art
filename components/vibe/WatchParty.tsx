'use client'

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track } from 'livekit-client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import VideoPlayer from './VideoPlayer'
import { Mic, MicOff, Video as VideoIcon, VideoOff, LogOut, Link2, Users } from 'lucide-react'

interface WatchPartyProps {
  token: string
  livekitUrl: string
  room: any
  contact: any
  isHost: boolean
}

export default function WatchParty({ token, livekitUrl, room, contact, isHost }: WatchPartyProps) {
  const [watchUrl, setWatchUrl] = useState(room.watch_url || '')
  const [newUrl, setNewUrl] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [disconnected, setDisconnected] = useState(false)
  const supabase = createClient()

  // Listen for URL changes from host via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`vibe:watch:${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'vibe_rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        if (payload.new && payload.new.watch_url !== undefined) {
          setWatchUrl(payload.new.watch_url)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room.id])

  async function updateWatchUrl() {
    if (!newUrl.trim() || !isHost) return
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('vibe_rooms')
        .update({ watch_url: newUrl.trim() })
        .eq('id', room.id)
      if (!error) {
        setWatchUrl(newUrl.trim())
        setNewUrl('')
      }
    } catch (err) {
      console.error('Failed to update watch url:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDisconnect = useCallback(() => {
    setDisconnected(true)
    setTimeout(() => {
      window.location.href = isHost ? '/vibe/lobby' : '/vibe'
    }, 2500)
  }, [isHost])

  if (disconnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white gap-4">
        <div className="text-5xl animate-bounce">👋</div>
        <div className="text-xl font-semibold">Watch party ended</div>
        <div className="text-neutral-400 text-sm">
          {isHost ? 'Returning to admin lobby…' : `See you next time, ${contact.name}!`}
        </div>
        <button
          onClick={() => { window.location.href = isHost ? '/vibe/lobby' : '/vibe' }}
          className="mt-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer border-none"
        >
          {isHost ? 'Back to Admin Lobby' : 'Back to Waiting Room'}
        </button>
        <p className="text-[10px] text-neutral-600">Redirecting automatically…</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col select-none text-zinc-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-zinc-950 border-b border-zinc-900 flex-shrink-0 z-20 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center text-lg">
            ⚽
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-zinc-100">{room.display_name}</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Football Watch Party</p>
          </div>
        </div>

        {isHost && (
          <div className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Paste stream link (.m3u8, youtube, twitch)..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateWatchUrl()}
                disabled={isUpdating}
                className="bg-zinc-900/50 border border-zinc-800 text-zinc-100 text-xs py-2 pr-4 pl-9 rounded-xl w-full placeholder-zinc-600 outline-none focus:border-purple-500/50 transition-all duration-200"
              />
            </div>
            <button
              onClick={updateWatchUrl}
              disabled={isUpdating || !newUrl.trim()}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 active:scale-[0.97] cursor-pointer disabled:opacity-40 border-none"
            >
              Update
            </button>
          </div>
        )}
      </header>

      {/* Main: stream + sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Stream Area */}
        <div className="h-[60vh] md:h-full flex-1 bg-black relative flex items-center justify-center">
          <VideoPlayer url={watchUrl} />
        </div>

        {/* LiveKit Sidebar */}
        <div className="w-full md:w-60 h-[40vh] md:h-full bg-zinc-950/80 backdrop-blur-md border-t md:border-t-0 md:border-l border-zinc-900 flex flex-col flex-shrink-0">
          <LiveKitRoom
            token={token}
            serverUrl={livekitUrl}
            connect={true}
            video={true}
            audio={true}
            onDisconnected={handleDisconnect}
            data-lk-theme="default"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div className="flex-shrink-0 p-4 border-b border-zinc-900/60 flex justify-between items-center bg-zinc-950/20">
              <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                <span>Call Members</span>
              </span>
              {isHost && (
                <span className="text-[9px] font-bold uppercase tracking-widest bg-purple-600/30 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  Host
                </span>
              )}
            </div>

            <CallSidebar />
            <LocalControls contact={contact} isHost={isHost} onLeave={handleDisconnect} />

            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </div>
    </div>
  )
}

function CallSidebar() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ])

  return (
    <div className="flex-1 flex md:flex-col overflow-x-auto md:overflow-x-hidden md:overflow-y-auto p-3 gap-3 scrollbar-thin scrollbar-thumb-zinc-800">
      {tracks.map((track, i) => (
        <div key={i} className="aspect-video w-36 md:w-full shrink-0 bg-zinc-900 border border-zinc-800/40 rounded-xl overflow-hidden relative group shadow-md">
          {track.publication?.track ? (
            <video
              ref={(el) => { if (el && track.publication?.track) track.publication.track.attach(el) }}
              className="w-full h-full object-cover"
              autoPlay
              muted={track.participant.isLocal}
              playsInline
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-xl font-bold border border-zinc-900">
              <span className="text-3xl filter saturate-[0.8] mb-1">👤</span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-extrabold">Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center pointer-events-none">
            <span className="text-[9px] font-bold text-white bg-black/60 backdrop-blur-[2px] px-2 py-0.5 rounded border border-white/5 truncate max-w-[100px]">
              {track.participant.name}
            </span>
            {track.participant.isSpeaking && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function LocalControls({ contact, isHost, onLeave }: { contact: any; isHost: boolean; onLeave: () => void }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant()

  const toggleMic = useCallback(async () => {
    if (!localParticipant) return
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
    } catch (e) {
      console.error('Failed to toggle mic:', e)
    }
  }, [localParticipant, isMicrophoneEnabled])

  const toggleCam = useCallback(async () => {
    if (!localParticipant) return
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled)
    } catch (e) {
      console.error('Failed to toggle camera:', e)
    }
  }, [localParticipant, isCameraEnabled])

  const micMuted = !isMicrophoneEnabled
  const camOff = !isCameraEnabled

  return (
    <div className="flex-shrink-0 p-4 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] text-zinc-500 font-bold max-w-[120px] truncate">
          {contact?.avatar_emoji} {contact?.name}
        </span>
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="flex items-center gap-2 justify-between">
        {/* Mic toggle */}
        <button
          onClick={toggleMic}
          title={micMuted ? 'Unmute mic' : 'Mute mic'}
          className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
            micMuted
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          {micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        {/* Camera toggle */}
        <button
          onClick={toggleCam}
          title={camOff ? 'Turn camera on' : 'Turn camera off'}
          className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
            camOff
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          {camOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
        </button>

        {/* Leave button */}
        <button
          onClick={onLeave}
          title="Leave watch party"
          className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 border border-rose-700/20 text-white flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer border-none"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

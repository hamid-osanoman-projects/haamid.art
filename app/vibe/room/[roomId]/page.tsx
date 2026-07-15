'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
const CallRoom = dynamic(() => import('@/components/vibe/CallRoom'), { ssr: false })
import { Loader2 } from 'lucide-react'

export default function RoomPage() {
  const { roomId } = useParams()
  const [token, setToken] = useState<string | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [participant, setParticipant] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const supabase = createClient()

      // ── Step 1: Determine WHO is visiting ──────────────────────────────
      // Check if Hamid (admin) is logged in via Supabase auth
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'hamid@haaamid.art'
      const adminIsLoggedIn = !!authUser && authUser.email === ownerEmail

      let participantData: any = null
      let hostFlag = false

      if (adminIsLoggedIn) {
        // Admin path: use the Supabase user as participant identity
        participantData = {
          id: authUser!.id,
          name: 'Hamid',
          avatar_emoji: '👑',
          avatar_color: '#7F77DD',
        }
        hostFlag = true
        setIsAdmin(true)
      } else {
        // Guest path: read from localStorage (set after code entry)
        const stored = localStorage.getItem('vibe_contact')
        if (!stored) {
          // Guest not authenticated → send them to the code entry page
          window.location.href = '/vibe'
          return
        }
        participantData = JSON.parse(stored)
        hostFlag = false
        setIsAdmin(false)
      }

      setParticipant(participantData)

      // ── Step 2: Load room details ───────────────────────────────────────
      const { data: roomData, error: roomErr } = await supabase
        .from('vibe_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomErr || !roomData || roomData.status === 'ended') {
        setError('This call has ended or does not exist.')
        setLoading(false)
        return
      }

      setRoom(roomData)

      // ── Step 3: Get LiveKit token ──────────────────────────────────────
      try {
        const res = await fetch('/api/vibe/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: roomData.room_name,
            participantName: participantData.name,
            participantId: participantData.id,
            isHost: hostFlag,
          }),
        })

        if (!res.ok) throw new Error('Failed to generate token')

        const data = await res.json()
        setToken(data.token)

        // Log join event for guests (admin join tracked differently)
        if (!hostFlag) {
          await supabase.from('vibe_call_log').insert({
            room_id: roomId,
            contact_id: participantData.id,
          })
        }
      } catch (tokenErr) {
        setError('Failed to connect to the call server. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [roomId])

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-xs uppercase tracking-wider font-bold">Joining call...</p>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-zinc-400 gap-4">
        <div className="text-4xl">⚠️</div>
        <div className="text-sm font-semibold text-zinc-300">{error}</div>
        <button
          onClick={() => window.location.href = isAdmin ? '/vibe/lobby' : '/vibe'}
          className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-xs font-semibold rounded-xl text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          {isAdmin ? 'Back to Admin Lobby' : 'Back to Waiting Room'}
        </button>
      </div>
    )
  }

  if (!token || !room || !participant) return null

  // Redirect to watch party page if room type is watch_party
  if (room.type === 'watch_party') {
    window.location.href = `/vibe/watch/${roomId}`
    return null
  }

  return (
    <CallRoom
      token={token}
      livekitUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
      roomId={roomId as string}
      contact={participant}
      room={room}
      isAdmin={isAdmin}
    />
  )
}

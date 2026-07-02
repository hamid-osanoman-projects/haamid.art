'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import WatchParty from '@/components/vibe/WatchParty'
import { Loader2 } from 'lucide-react'

export default function WatchPartyPage() {
  const { roomId } = useParams()
  const [token, setToken] = useState<string | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [contact, setContact] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem('vibe_contact')
      const supabase = createClient()

      // Check if this is Hamid (host) — he'll have a valid auth session
      const { data: { user } } = await supabase.auth.getUser()
      const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'hamid@haaamid.art'

      let contactData = null
      let hostFlag = false

      if (user && user.email === ownerEmail) {
        // Hamid is the host
        contactData = { id: user.id, name: 'Hamid', avatar_emoji: '👑', avatar_color: '#7F77DD' }
        hostFlag = true
        setIsHost(true)
        setIsAdmin(true)
      } else if (stored) {
        // Otherwise, load contact info from localStorage
        contactData = JSON.parse(stored)
      } else {
        // No auth session and no invitation code: send back to entry page
        window.location.href = '/vibe'
        return
      }

      setContact(contactData)

      // Fetch room details from Supabase
      const { data: roomData, error: roomErr } = await supabase
        .from('vibe_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomErr || !roomData || roomData.status === 'ended') {
        setError('This watch party has ended')
        setLoading(false)
        return
      }

      setRoom(roomData)

      // Get LiveKit token for this connection
      try {
        const res = await fetch('/api/vibe/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: roomData.room_name,
            participantName: contactData.name,
            participantId: contactData.id,
            isHost: hostFlag,
          }),
        })

        if (!res.ok) {
          throw new Error('Failed to generate LiveKit token')
        }

        const { token: livekitToken } = await res.json()
        setToken(livekitToken)

        // Log join event
        await supabase.from('vibe_call_log').insert({
          room_id: roomId,
          contact_id: hostFlag ? null : contactData.id,
        })
      } catch (err) {
        setError('Failed to fetch credentials for watch party.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [roomId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-xs uppercase tracking-wider font-bold">Joining watch party...</p>
      </div>
    )
  }

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

  if (!token || !room) return null

  return (
    <WatchParty
      token={token}
      livekitUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
      room={room}
      contact={contact}
      isHost={isHost}
    />
  )
}

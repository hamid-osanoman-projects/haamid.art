import { createClient } from '@/lib/supabase/server'
import { RoomServiceClient } from 'livekit-server-sdk'
import { NextResponse } from 'next/server'

// Helper to get LiveKit room service client
function getRoomService() {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';
  const apiKey = process.env.LIVEKIT_API_KEY || '';
  const apiSecret = process.env.LIVEKIT_API_SECRET || '';

  const restUrl = url.replace('wss://', 'https://').replace('ws://', 'http://');
  return new RoomServiceClient(restUrl, apiKey, apiSecret);
}

// POST /api/vibe/room — Create a new room
export async function POST(request: Request) {
  try {
    const { type, contactIds, watchUrl, displayName } = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const baseRoomName = `vibe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const roomName = type === 'p2p_call' ? `p2p-${baseRoomName}` : baseRoomName;
    
    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (url && apiKey && apiSecret && type !== 'p2p_call') {
      try {
        const roomService = getRoomService();
        // Create room in LiveKit
        await roomService.createRoom({
          name: roomName,
          emptyTimeout: 300,                      // Auto-delete if empty for 5 mins
          maxParticipants: 12,                    // Max group size
          metadata: JSON.stringify({ type, owner: user.id }),
        })
      } catch (lkErr) {
        console.warn('LiveKit room service creation failed, falling back:', lkErr);
      }
    } else {
      console.warn('LiveKit environment variables are missing. Bypassing LiveKit room registration.');
    }

    // Save room to Supabase
    const { data: room, error } = await supabase
      .from('vibe_rooms')
      .insert({
        owner_id: user.id,
        room_name: roomName,
        display_name: displayName ?? (type === 'watch_party' ? '⚽ Watch Party' : type === 'p2p_call' ? '🔒 1v1 P2P Call' : '📞 Call'),
        type: type === 'p2p_call' ? 'call' : type,
        status: 'active',
        watch_url: watchUrl ?? '',
        invited_contact_ids: contactIds ?? [],
      })
      .select()
      .single()

    if (error || !room) {
      console.error('Failed to insert room into database:', error)
      return NextResponse.json({ error: 'Database room creation failed' }, { status: 500 })
    }

    // Send push notification to all invited contacts
    if (contactIds?.length > 0) {
      const origin = new URL(request.url).origin
      try {
        await fetch(`${origin}/api/vibe/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactIds,
            roomId: room.id,
            roomName,
            type,
            message: type === 'watch_party' ? '⚽ Hamid is starting a watch party!' : type === 'p2p_call' ? '🔒 Hamid is starting a secure P2P call!' : '📞 Hamid is calling you!',
          }),
        })
      } catch (notifyErr) {
        console.warn('Notification trigger skipped or failed:', notifyErr)
      }
    }

    return NextResponse.json({ room })
  } catch (err: any) {
    console.error('Room creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/vibe/room — End a room
export async function PATCH(request: Request) {
  try {
    const { roomId, roomName } = await request.json()
    const supabase = await createClient()

    const { error } = await supabase
      .from('vibe_rooms')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', roomId)

    if (error) {
      console.error('Failed to update room in DB:', error)
    }

    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (url && apiKey && apiSecret) {
      try {
        const roomService = getRoomService();
        await roomService.deleteRoom(roomName)
      } catch (lkErr) {
        console.warn('LiveKit room deletion skipped or not found:', lkErr)
      }
    } else {
      console.warn('LiveKit keys are empty, skipping LiveKit deleteRoom execution.');
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Room ending error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

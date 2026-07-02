import { AccessToken } from 'livekit-server-sdk'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { roomName, participantName, participantId, isHost } = await request.json()

    if (!roomName || !participantName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit server credentials not configured' }, { status: 500 })
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantId ?? participantName,
      name: participantName,
      ttl: '4h',                              // Token valid for 4 hours
    })

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,                       // Can send video/audio
      canSubscribe: true,                     // Can receive video/audio
      canPublishData: true,                   // Can send data messages (for watch sync)
      roomAdmin: isHost ?? false,             // Hamid gets admin (can mute/remove)
      roomCreate: isHost ?? false,
    })

    return NextResponse.json({
      token: await token.toJwt(),
      roomName,
      livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    })
  } catch (err: any) {
    console.error('Token generation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

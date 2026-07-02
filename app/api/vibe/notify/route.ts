import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Set VAPID details for Web Push
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:hamid@haaamid.art'
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export async function POST(request: Request) {
  try {
    const { contactIds, roomId, roomName, type, message } = await request.json()

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'contactIds array required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get push subscriptions for all invited contacts
    const { data: subs, error: subsError } = await supabase
      .from('vibe_push_subscriptions')
      .select('subscription, contact_id')
      .in('contact_id', contactIds)

    if (subsError) {
      console.error('Failed to retrieve push subscriptions:', subsError)
    }

    const payload = JSON.stringify({
      title: 'Hamid is calling 📞',
      body: message || 'Hamid is inviting you to a call.',
      icon: '/vibe-icon-192.png',
      badge: '/vibe-icon-192.png',
      data: {
        roomId,
        roomName,
        type,
        url: type === 'watch_party' ? `/vibe/watch/${roomId}` : `/vibe/room/${roomId}`,
      },
      requireInteraction: true,               // Notification stays until tapped
      vibrate: [200, 100, 200, 100, 200],     // Vibration pattern
      actions: [
        { action: 'join', title: '✅ Join' },
        { action: 'decline', title: '❌ Decline' },
      ],
    })

    // 1. Broadcast via Supabase Realtime (for contacts currently on the waiting screen)
    const channel = supabase.channel('vibe:broadcast')
    await new Promise((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          Promise.all(
            contactIds.map(contactId =>
              channel.send({
                type: 'broadcast',
                event: `call:${contactId}`,
                payload: { roomId, roomName, type, message },
              })
            )
          ).then(() => {
            supabase.removeChannel(channel).then(resolve)
          }).catch((sendErr) => {
            console.error('Realtime broadcast failed:', sendErr)
            resolve(null)
          })
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          resolve(null)
        }
      })
    })

    // 2. Send Web Push to all registered offline devices
    let sent = 0
    if (subs && subs.length > 0 && vapidPublicKey && vapidPrivateKey) {
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub.subscription as any, payload)
          sent++
        } catch (err: any) {
          console.warn(`Failed to push notification to contact ${sub.contact_id}:`, err.statusCode)
          // If subscription expired (410 Gone or 404 Not Found), remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase
              .from('vibe_push_subscriptions')
              .delete()
              .eq('contact_id', sub.contact_id)
          }
        }
      }
    }

    return NextResponse.json({ sent, broadcast: true })
  } catch (err: any) {
    console.error('Notify route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { contactId, subscription, userAgent } = await request.json()

    if (!contactId || !subscription) {
      return NextResponse.json({ error: 'Missing contactId or subscription' }, { status: 400 })
    }

    const supabase = await createClient()

    // Save/upsert Web Push subscription details
    const { error } = await supabase
      .from('vibe_push_subscriptions')
      .upsert({
        contact_id: contactId,
        subscription,
        user_agent: userAgent || ''
      }, { onConflict: 'contact_id' })

    if (error) {
      console.error('Failed to upsert push subscription:', error)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Push subscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

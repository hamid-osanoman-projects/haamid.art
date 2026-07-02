import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Look up the contact by code (case-insensitive)
    const { data: contact, error } = await supabase
      .from('vibe_contacts')
      .select('id, name, avatar_emoji, avatar_color, relation')
      .eq('code', code.toLowerCase().trim())
      .single()

    if (error || !contact) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
    }

    // Update last_seen and online status
    await supabase
      .from('vibe_contacts')
      .update({ last_seen_at: new Date().toISOString(), is_online: true })
      .eq('id', contact.id)

    // Check if there's an active room they're invited to
    const { data: activeRooms } = await supabase
      .from('vibe_rooms')
      .select('id, room_name, type, watch_url, display_name')
      .eq('status', 'active')
      .contains('invited_contact_ids', [contact.id])
      .order('created_at', { ascending: false })
      .limit(1)

    const activeRoom = activeRooms && activeRooms.length > 0 ? activeRooms[0] : null;

    return NextResponse.json({
      contact,
      activeRoom: activeRoom ?? null,
    })
  } catch (err: any) {
    console.error('Vibe auth error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

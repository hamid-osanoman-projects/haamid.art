import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership of the parent work
  const { data: work, error: fetchErr } = await supabase
    .from('works')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (fetchErr || !work || work.user_id !== user.id) {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 })
  }

  const { data: attachments, error: queryErr } = await supabase
    .from('work_attachments')
    .select('*')
    .eq('work_id', id)
    .order('created_at', { ascending: false })

  if (queryErr) {
    return NextResponse.json({ error: queryErr.message }, { status: 500 })
  }

  return NextResponse.json({ attachments: attachments || [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify ownership of the parent work
    const { data: work, error: fetchErr } = await supabase
      .from('works')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchErr || !work || work.user_id !== user.id) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const { type, title, url } = await request.json()
    if (!title || !url || !type) {
      return NextResponse.json({ error: 'Type, title, and URL are required' }, { status: 400 })
    }

    const validTypes = ['link', 'file', 'figma', 'github', 'doc']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid attachment type' }, { status: 400 })
    }

    const { data: attachment, error: insertErr } = await supabase
      .from('work_attachments')
      .insert({
        work_id: id,
        type,
        title: title.trim(),
        url: url.trim()
      })
      .select()
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // Log the attachment creation in updates
    await supabase.from('work_updates').insert({
      work_id: id,
      content: `Added attachment: ${type} - ${title}`
    })

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

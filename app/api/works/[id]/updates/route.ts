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

  const { data: updates, error: queryErr } = await supabase
    .from('work_updates')
    .select('*')
    .eq('work_id', id)
    .order('created_at', { ascending: false })

  if (queryErr) {
    return NextResponse.json({ error: queryErr.message }, { status: 500 })
  }

  return NextResponse.json({ updates: updates || [] })
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

    const { content } = await request.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const { data: update, error: insertErr } = await supabase
      .from('work_updates')
      .insert({
        work_id: id,
        content: content.trim()
      })
      .select()
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ update }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

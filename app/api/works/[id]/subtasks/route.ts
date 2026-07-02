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

  const { data: subtasks, error: queryErr } = await supabase
    .from('work_subtasks')
    .select('*')
    .eq('work_id', id)
    .order('sort_order', { ascending: true })

  if (queryErr) {
    return NextResponse.json({ error: queryErr.message }, { status: 500 })
  }

  return NextResponse.json({ subtasks: subtasks || [] })
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

    const { title } = await request.json()
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get current max sort_order
    const { data: existing } = await supabase
      .from('work_subtasks')
      .select('sort_order')
      .eq('work_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existing?.[0] ? existing[0].sort_order + 1 : 0

    const { data: subtask, error: insertErr } = await supabase
      .from('work_subtasks')
      .insert({
        work_id: id,
        title: title.trim(),
        completed: false,
        sort_order: nextOrder
      })
      .select()
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ subtask }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

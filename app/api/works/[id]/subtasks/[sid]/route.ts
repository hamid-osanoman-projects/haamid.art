import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id, sid } = await params
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

    const body = await request.json()
    const { title, completed, sort_order } = body

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (completed !== undefined) updates.completed = completed
    if (sort_order !== undefined) updates.sort_order = sort_order

    const { data: subtask, error: updateErr } = await supabase
      .from('work_subtasks')
      .update(updates)
      .eq('id', sid)
      .eq('work_id', id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ subtask })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id, sid } = await params
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

  const { error: deleteErr } = await supabase
    .from('work_subtasks')
    .delete()
    .eq('id', sid)
    .eq('work_id', id)

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

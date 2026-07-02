import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  const { id, mid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership via parent work
  const { data: work } = await supabase
    .from('works')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!work) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.due_date !== undefined) updates.due_date = body.due_date
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order

  // Handle completion toggle
  if (body.completed !== undefined) {
    updates.completed = body.completed
    updates.completed_at = body.completed ? new Date().toISOString() : null
  }

  const { data, error } = await supabase
    .from('work_milestones')
    .update(updates)
    .eq('id', mid)
    .eq('work_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log completion in activity feed
  if (body.completed !== undefined) {
    await supabase.from('work_updates').insert({
      work_id: id,
      content: body.completed
        ? `Completed milestone: ${data.title}`
        : `Reopened milestone: ${data.title}`
    })
  }

  return NextResponse.json({ milestone: data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  const { id, mid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: work } = await supabase
    .from('works')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!work) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase
    .from('work_milestones')
    .delete()
    .eq('id', mid)
    .eq('work_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

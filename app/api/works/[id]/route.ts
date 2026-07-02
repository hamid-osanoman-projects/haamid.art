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

  const { data: work, error } = await supabase
    .from('works_with_time')
    .select('*, clients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !work) {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 })
  }

  return NextResponse.json({ work })
}

export async function PUT(
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
    // Verify ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('works')
      .select('user_id, status, started_at, completed_at, is_recurring, recur_interval, title, track, priority, estimated_hours, description, client_id, icon, color, tags')
      .eq('id', id)
      .single()

    if (fetchErr || !existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    const body = await request.json()
    const updates: any = { ...body, updated_at: new Date().toISOString() }

    // Auto-set completed_at when status transitions to 'done'
    if (body.status === 'done' && existing.status !== 'done') {
      updates.completed_at = new Date().toISOString()
    }
    // Auto-set started_at when status moves from backlog to active/in-progress
    if (body.status === 'in_progress' && existing.status === 'backlog') {
      updates.started_at = existing.started_at || new Date().toISOString()
    }

    const { data: updatedWork, error: updateErr } = await supabase
      .from('works')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Auto-log status change in work_updates table
    if (body.status && body.status !== existing.status) {
      const statusLabels: Record<string, string> = {
        backlog: 'Backlog',
        this_week: 'This week',
        in_progress: 'In progress',
        blocked: 'Blocked',
        in_review: 'In review',
        done: 'Done',
        cancelled: 'Cancelled',
        on_hold: 'On hold'
      }
      const label = statusLabels[body.status] || body.status
      const reason = body.blocked_reason ? `: ${body.blocked_reason}` : ''
      
      await supabase.from('work_updates').insert({
        work_id: id,
        content: `Status changed to ${label}${reason}`
      })
    }

    // Task Recurrence Auto-Reset
    if (body.status === 'done' && existing.status !== 'done' && existing.is_recurring) {
      // Calculate next due date
      const nextDue = new Date()
      const interval = String(existing.recur_interval || 'weekly').toLowerCase()
      if (interval === 'daily') {
        nextDue.setDate(nextDue.getDate() + 1)
      } else if (interval === 'monthly') {
        nextDue.setMonth(nextDue.getMonth() + 1)
      } else {
        // default to weekly
        nextDue.setDate(nextDue.getDate() + 7)
      }

      // Create backlog replica
      const { data: newWork, error: cloneErr } = await supabase
        .from('works')
        .insert({
          user_id: user.id,
          title: existing.title,
          track: existing.track,
          status: 'backlog',
          priority: existing.priority,
          description: existing.description,
          due_date: nextDue.toISOString().split('T')[0],
          estimated_hours: existing.estimated_hours,
          client_id: existing.client_id,
          icon: existing.icon,
          color: existing.color,
          tags: existing.tags || [],
          is_recurring: true,
          recur_interval: existing.recur_interval
        })
        .select()
        .single()

      if (!cloneErr && newWork) {
        // Copy subtasks of completed task in an unchecked state
        const { data: subtasks } = await supabase
          .from('work_subtasks')
          .select('title, sort_order')
          .eq('work_id', id)

        if (subtasks && subtasks.length > 0) {
          const mappedSubtasks = subtasks.map(s => ({
            work_id: newWork.id,
            title: s.title,
            completed: false,
            sort_order: s.sort_order
          }))

          await supabase.from('work_subtasks').insert(mappedSubtasks)
        }

        // Add resetting log entry in activity updates
        await supabase.from('work_updates').insert([
          {
            work_id: id,
            content: `Recurring task reset for next cycle (Next due: ${newWork.due_date})`
          },
          {
            work_id: newWork.id,
            content: 'Task initiated from recurring reset cycle.'
          }
        ])
      }
    }

    return NextResponse.json({ work: updatedWork })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: existing, error: fetchErr } = await supabase
    .from('works')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchErr || !existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 })
  }

  const { error: deleteErr } = await supabase
    .from('works')
    .delete()
    .eq('id', id)

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

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

  const { data: logs, error: queryErr } = await supabase
    .from('work_time_logs')
    .select('*')
    .eq('work_id', id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (queryErr) {
    return NextResponse.json({ error: queryErr.message }, { status: 500 })
  }

  return NextResponse.json({ logs: logs || [] })
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

    const { hours, description, date } = await request.json()
    const numericHours = Number(hours)

    if (isNaN(numericHours) || numericHours <= 0 || numericHours > 24) {
      return NextResponse.json({ error: 'Hours must be a number between 0 and 24' }, { status: 400 })
    }

    const logDate = date || new Date().toISOString().split('T')[0]

    const { data: log, error: insertErr } = await supabase
      .from('work_time_logs')
      .insert({
        work_id: id,
        user_id: user.id,
        date: logDate,
        hours: numericHours,
        description: description || ''
      })
      .select()
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // Log the time entry in work updates activity log
    const comment = description ? `: ${description}` : ''
    await supabase.from('work_updates').insert({
      work_id: id,
      content: `Logged ${numericHours}h${comment}`
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

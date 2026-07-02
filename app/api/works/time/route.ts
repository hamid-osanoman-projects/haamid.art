import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: logs, error } = await supabase
      .from('work_time_logs')
      .select('*, works(title, track, color, icon)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ logs: logs || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { work_id, hours, description, date } = await request.json()
    if (!work_id) {
      return NextResponse.json({ error: 'Work item (work_id) is required' }, { status: 400 })
    }

    const numericHours = Number(hours)
    if (isNaN(numericHours) || numericHours <= 0 || numericHours > 24) {
      return NextResponse.json({ error: 'Hours must be a number between 0 and 24' }, { status: 400 })
    }

    // Verify ownership of the parent work
    const { data: work, error: fetchErr } = await supabase
      .from('works')
      .select('id, user_id, title')
      .eq('id', work_id)
      .single()

    if (fetchErr || !work || work.user_id !== user.id) {
      return NextResponse.json({ error: 'Work item not found or unauthorized' }, { status: 404 })
    }

    const logDate = date || new Date().toISOString().split('T')[0]

    const { data: log, error: insertErr } = await supabase
      .from('work_time_logs')
      .insert({
        work_id,
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

    // Log update in activity feed
    const comment = description ? `: ${description}` : ''
    await supabase.from('work_updates').insert({
      work_id,
      content: `Logged ${numericHours}h${comment}`
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to log time' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')
  if (!weekStart) {
    return NextResponse.json({ error: 'week_start date parameter is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: plan, error } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ plan: plan || null })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { week_start, goals, notes, review_notes, tasks_planned, tasks_completed, hours_logged } = await request.json()
    if (!week_start) {
      return NextResponse.json({ error: 'week_start is required' }, { status: 400 })
    }

    const { data: plan, error } = await supabase
      .from('weekly_plans')
      .upsert({
        user_id: user.id,
        week_start,
        goals: goals || [],
        notes: notes || '',
        review_notes: review_notes || '',
        tasks_planned: tasks_planned || 0,
        tasks_completed: tasks_completed || 0,
        hours_logged: hours_logged || 0,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, week_start'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plan })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

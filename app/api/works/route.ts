import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabase
    .from('works_with_time')
    .select('*, clients(*)')
    .eq('user_id', user.id)

  // Apply filters
  const track = searchParams.get('track')
  if (track) query = query.eq('track', track)

  const status = searchParams.get('status')
  if (status) query = query.eq('status', status)

  const priority = searchParams.get('priority')
  if (priority) query = query.eq('priority', priority)

  const search = searchParams.get('search')
  if (search) query = query.ilike('title', `%${search}%`)

  const dueBefore = searchParams.get('due_before')
  if (dueBefore) query = query.lte('due_date', dueBefore)

  // Sort logic: priority order, then closest due date, then newest created
  // Note: custom order by mapping priorities to numbers in sql can be simulated by order priority
  query = query
    .order('priority', { ascending: false }) // Urgent, High, Medium, Low sort
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ works: data || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data: work, error } = await supabase
      .from('works')
      .insert({
        user_id: user.id,
        title: body.title,
        track: body.track || 'company',
        status: body.status || 'backlog',
        priority: body.priority || 'medium',
        description: body.description || '',
        due_date: body.due_date || null,
        estimated_hours: body.estimated_hours || null,
        client_id: body.client_id || null,
        tags: body.tags || [],
        icon: body.icon || '📋',
        color: body.color || '#7F77DD',
        is_recurring: body.is_recurring || false,
        recur_interval: body.recur_interval || '',
        progress: body.progress || 0
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add initial activity log update entry
    await supabase.from('work_updates').insert({
      work_id: work.id,
      content: `Task created: ${body.title}`
    })

    return NextResponse.json({ work }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

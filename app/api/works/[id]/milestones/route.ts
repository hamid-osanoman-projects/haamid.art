import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  const { data, error } = await supabase
    .from('work_milestones')
    .select('*')
    .eq('work_id', id)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ milestones: data || [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  const body = await request.json()
  if (!body.title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  // Get next sort_order
  const { data: existing } = await supabase
    .from('work_milestones')
    .select('sort_order')
    .eq('work_id', id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data, error } = await supabase
    .from('work_milestones')
    .insert({
      work_id: id,
      title: body.title,
      description: body.description || '',
      due_date: body.due_date || null,
      sort_order: nextOrder,
      completed: false
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity
  await supabase.from('work_updates').insert({
    work_id: id,
    content: `Added milestone: ${body.title}`
  })

  return NextResponse.json({ milestone: data }, { status: 201 })
}

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
    .from('invoices')
    .select('*')
    .eq('work_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data || [] })
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
  if (!body.amount) return NextResponse.json({ error: 'Amount required' }, { status: 400 })

  // Count existing invoices to generate number
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('work_id', id)

  const invoiceNumber = String((existing?.length || 0) + 1).padStart(3, '0')

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      work_id: id,
      invoice_number: invoiceNumber,
      amount: body.amount,
      currency: body.currency || 'OMR',
      due_date: body.due_date || null,
      notes: body.notes || '',
      status: 'unpaid'
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity
  await supabase.from('work_updates').insert({
    work_id: id,
    content: `Created invoice #${invoiceNumber} for ${body.amount} ${body.currency || 'OMR'}`
  })

  return NextResponse.json({ invoice: data }, { status: 201 })
}

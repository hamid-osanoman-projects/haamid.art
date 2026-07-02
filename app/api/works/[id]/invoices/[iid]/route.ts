import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; iid: string }> }
) {
  const { id, iid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership via parent work
  const { data: work } = await supabase
    .from('works')
    .select('id, title, client_id, clients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!work) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.amount !== undefined) updates.amount = body.amount
  if (body.currency !== undefined) updates.currency = body.currency
  if (body.due_date !== undefined) updates.due_date = body.due_date
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.pdf_url !== undefined) updates.pdf_url = body.pdf_url

  // Mark paid
  if (body.status === 'paid') {
    updates.status = 'paid'
    updates.paid_at = new Date().toISOString()
  } else if (body.status !== undefined) {
    updates.status = body.status
    if (body.status === 'unpaid') updates.paid_at = null
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', iid)
    .eq('work_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log status changes in activity feed
  if (body.status) {
    await supabase.from('work_updates').insert({
      work_id: id,
      content: body.status === 'paid'
        ? `Invoice #${data.invoice_number} marked as paid`
        : `Invoice #${data.invoice_number} status changed to ${body.status}`
    })
  }

  // Send payment reminder if requested
  if (body.send_reminder && work.clients) {
    const client = work.clients as { name?: string; email?: string; company?: string }
    if (client.email) {
      const resendApiKey = process.env.RESEND_API_KEY
      if (resendApiKey) {
        const resend = new Resend(resendApiKey)
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'hamid@haaamid.art',
            to: client.email,
            subject: `Payment reminder — Invoice #${data.invoice_number} for ${work.title}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 32px; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px;">
                <h2 style="font-size: 20px; font-weight: 800; color: #7F77DD; margin-bottom: 16px;">Payment Reminder</h2>
                <p>Hi ${client.name || 'there'},</p>
                <p>This is a friendly reminder regarding the following outstanding invoice:</p>
                <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0;"><strong>Project:</strong> ${work.title}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Invoice:</strong> #${data.invoice_number}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
                  ${data.due_date ? `<p style="margin: 0;"><strong>Due date:</strong> ${new Date(data.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>` : ''}
                </div>
                <p>Please let me know if you have any questions or if the payment has already been processed.</p>
                <p>Thank you for your continued partnership!</p>
                <p style="margin-top: 24px; font-weight: 600;">— Hamid U V</p>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                  This is an automated payment reminder from haaamid.art
                </p>
              </div>
            `
          })

          await supabase.from('work_updates').insert({
            work_id: id,
            content: `Sent payment reminder to ${client.name} (${client.email}) for Invoice #${data.invoice_number}`
          })
        } catch (emailErr) {
          console.error('Failed to send reminder email:', emailErr)
        }
      }
    }
  }

  return NextResponse.json({ invoice: data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; iid: string }> }
) {
  const { id, iid } = await params
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
    .from('invoices')
    .delete()
    .eq('id', iid)
    .eq('work_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

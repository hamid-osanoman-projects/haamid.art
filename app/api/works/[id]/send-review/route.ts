import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

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

  try {
    const { data: work, error: fetchErr } = await supabase
      .from('works')
      .select('client_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !work || !work.client_id) {
      return NextResponse.json({ review: null })
    }

    const { data: review, error: reviewErr } = await supabase
      .from('reviews')
      .select('*')
      .eq('client_id', work.client_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (reviewErr) {
      return NextResponse.json({ error: reviewErr.message }, { status: 500 })
    }

    return NextResponse.json({ review })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
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
    // 1. Fetch the project details to confirm ownership and get the client ID
    const { data: work, error: fetchErr } = await supabase
      .from('works')
      .select('*, clients(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !work) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!work.client_id || !work.clients) {
      return NextResponse.json({ error: 'No client linked to this project' }, { status: 400 })
    }

    const client = work.clients
    if (!client.email) {
      return NextResponse.json({ error: 'Client has no email address on file' }, { status: 400 })
    }

    // 2. Generate a random unique token
    const token = crypto.randomUUID()

    // 3. Insert draft review record with status='pending' and token
    const { data: review, error: reviewErr } = await supabase
      .from('reviews')
      .insert({
        client_id: work.client_id,
        token: token,
        status: 'pending',
        reviewer_name: client.name || '',
        reviewer_company: client.company || '',
        rating: 5,
        content: ''
      })
      .select()
      .single()

    if (reviewErr) {
      return NextResponse.json({ error: reviewErr.message }, { status: 500 })
    }

    // 4. Log the action in updates activity feed
    await supabase.from('work_updates').insert({
      work_id: id,
      content: `Sent review request to client: ${client.name} (${client.email})`
    })

    // 5. Send invitation email via Resend
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const origin = new URL(request.url).origin
      
      const { error: emailErr } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'hamid@haaamid.art',
        to: client.email,
        subject: `Quick review of our project: ${work.title}`,
        html: `
          <div style="font-family: sans-serif; padding: 24px; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="font-size: 20px; font-weight: 800; color: #7F77DD; margin-bottom: 16px;">Project Feedback Invitation</h2>
            <p>Hi ${client.name},</p>
            <p>I hope you are doing well!</p>
            <p>We recently wrapped up our work on <strong>${work.title}</strong>. I would highly appreciate it if you could spare a minute to share your feedback and leave a quick review for my portfolio.</p>
            <div style="margin: 24px 0;">
              <a href="${origin}/review?token=${token}" style="background-color: #7F77DD; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Share Feedback & Review
              </a>
            </div>
            <p style="font-size: 12px; color: #6b7280; margin-top: 32px; border-t: 1px solid #e5e7eb; padding-top: 16px;">
              This link is secure, personalized for you, and can only be used once. Thank you so much!
            </p>
          </div>
        `
      })

      if (emailErr) {
        console.error('Failed to send review email via Resend:', emailErr)
      }
    } else {
      console.warn('Resend API key not set, email dispatch skipped in development mode.')
    }

    return NextResponse.json({ success: true, token })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

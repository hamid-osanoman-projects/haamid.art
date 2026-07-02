import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { name, email, message, type, fingerprint } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase Client dynamically
    let dbSuccess = false;
    try {
      const supabase = await createClient();
      
      // Update/Upsert visitor information to segment = 'lead'
      if (fingerprint) {
        const { error: upsertError } = await supabase.from('visitors').upsert(
          {
            fingerprint,
            email,
            segment: 'lead',
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'fingerprint' }
        );

        if (!upsertError) {
          dbSuccess = true;
        } else {
          console.warn('Could not update visitor segment in Database:', upsertError);
        }
      }
    } catch (dbError) {
      console.warn('Database connection skipped or failed:', dbError);
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'contact@haaamid.art';
    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'hamid@haaamid.art';

    let emailSent = false;

    // Send emails via Resend
    if (resendKey) {
      const resend = new Resend(resendKey);

      try {
        // 1. Email to Hamid
        const hireTag = type === 'hire' ? '[HIRE]' : '';
        await resend.emails.send({
          from: fromEmail,
          to: ownerEmail,
          subject: `✉️ ${hireTag} New contact from ${name} via haaamid.art`,
          html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Type:</strong> ${type || 'general'}</p>
            <p><strong>Database Logged:</strong> ${dbSuccess ? 'Yes' : 'No'}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          `,
        });

        // 2. Auto-reply to visitor
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `Got your message, Hamid will reply shortly`,
          html: `
            <p>Hi ${name},</p>
            <p>Thanks for reaching out! I've received your message regarding "<strong>${type || 'collaboration'}</strong>" and will review it shortly.</p>
            <p>If this is urgent, feel free to reply directly to this email.</p>
            <br />
            <p>Best regards,</p>
            <p><strong>Hamid U V</strong><br /><a href="https://haaamid.art">haaamid.art</a></p>
          `,
        });

        emailSent = true;
      } catch (emailErr) {
        console.error('Error sending emails via Resend SDK:', emailErr);
      }
    } else {
      console.log('--- local development contact submit ---');
      console.log('To:', ownerEmail);
      console.log('Subject: New contact form submission');
      console.log('Data:', { name, email, type, message });
      console.log('----------------------------------------');
    }

    return NextResponse.json({
      success: true,
      dbLogged: dbSuccess,
      emailSent: emailSent,
      message: 'Message sent successfully!',
    });

  } catch (error: any) {
    console.error('API Error in /api/contact:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

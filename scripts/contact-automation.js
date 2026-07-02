const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const resendKey = process.env.RESEND_API_KEY;

async function run() {
  console.log('Checking for new contact form leads in database...');
  
  if (!supabaseUrl || !supabaseServiceKey || !resendKey) {
    console.error('Missing required environment keys for contact automation.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch leads created in the last 15 minutes to prevent spamming repeats
    const timeOffset = new Date(Date.now() - 15 * 60000).toISOString();
    
    const { data: leads, error } = await supabase
      .from('visitors')
      .select('*')
      .eq('segment', 'lead')
      .gt('created_at', timeOffset);

    if (error) {
      console.error('DB read failed:', error);
      return;
    }

    if (!leads || leads.length === 0) {
      console.log('No new contact leads in the current checkpoint window.');
      return;
    }

    console.log(`Processing ${leads.length} contact submissions...`);

    for (const lead of leads) {
      const metadata = lead.metadata || {};
      const name = metadata.name || 'Anonymous Visitor';
      const email = metadata.email || '';
      const message = metadata.message || '';
      const isHire = metadata.type === 'hire';
      
      const location = `${lead.city || 'Unknown City'}, ${lead.country || 'Unknown Country'}`;

      // 1. Dispatch notification email to Hamid
      const subjectToHamid = `${isHire ? '⏰ [HIRE PRIORITY] ' : ''}New contact from ${name} via haaamid.art`;
      
      const htmlToHamid = `
        <div style="font-family: sans-serif; padding: 20px; color: #0a0a0a;">
          <h2 style="color: #7F77DD;">New Lead Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Type:</strong> ${metadata.type || 'Inquiry'}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 3px solid #7F77DD; padding-left: 10px; color: #444; font-style: italic;">
            ${message}
          </blockquote>
        </div>
      `;

      console.log(`Dispatching email alert to Hamid for submission from: ${name}`);
      
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: 'Contact Forms <hamid@haaamid.art>',
          to: 'hamid@haaamid.art',
          subject: subjectToHamid,
          html: htmlToHamid
        })
      });

      // 2. Dispatch warm auto-confirmation response to visitor
      if (email) {
        const subjectToVisitor = 'Got your message, I will reply shortly';
        const htmlToVisitor = `
          <div style="font-family: sans-serif; max-width: 500px; padding: 30px; border: 1px solid #e5e5e5; border-radius: 12px; color: #0a0a0a;">
            <h3 style="color: #7F77DD; margin-top: 0;">Hi ${name},</h3>
            <p style="font-size: 13px; line-height: 1.6; color: #333;">
              Thank you for reaching out! This is an automated confirmation to let you know that I have received your message regarding: <strong>${metadata.type || 'Inquiry'}</strong>.
            </p>
            <p style="font-size: 13px; line-height: 1.6; color: #333;">
              I will review your message and get back to you shortly. In the meantime, you can explore my open-source tools and projects on my portfolio.
            </p>
            <p style="font-size: 13px; line-height: 1.6; color: #333; margin-bottom: 24px;">
              Best regards,<br>
              <strong>Hamid U V</strong><br>
              <a href="https://haaamid.art" style="color: #7F77DD; text-decoration: none;">haaamid.art</a>
            </p>
          </div>
        `;

        console.log(`Sending auto-confirmation email to visitor: ${email}`);

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`
          },
          body: JSON.stringify({
            from: 'Hamid <hamid@haaamid.art>',
            to: email,
            subject: subjectToVisitor,
            html: htmlToVisitor
          })
        });
      }
    }
  } catch (err) {
    console.error('Contact form automation execution failed:', err);
  }
}

run().catch(console.error);

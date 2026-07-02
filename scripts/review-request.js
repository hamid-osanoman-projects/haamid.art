const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const resendKey = process.env.RESEND_API_KEY;

async function run() {
  console.log('Checking for completed freelance projects lacking reviews...');

  if (!supabaseUrl || !supabaseServiceKey || !resendKey) {
    console.error('Missing required environment keys for review request automations.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Fetch completed freelance projects
    const { data: projects, error: projectsErr } = await supabase
      .from('works')
      .select(`
        *,
        clients (
          name,
          email,
          company
        )
      `)
      .eq('track', 'freelance')
      .eq('status', 'done');

    if (projectsErr) {
      console.error('Failed to fetch freelance projects:', projectsErr);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('No completed freelance projects found.');
      return;
    }

    console.log(`Analyzing ${projects.length} completed projects...`);

    for (const project of projects) {
      // Check if email is on file
      const email = project.clients?.email;
      const clientName = project.clients?.name || 'Valued Client';
      if (!email) {
        console.log(`Skipping project ID: ${project.id}. No client email.`);
        continue;
      }

      // 2. Verify if a review entry already exists for this project
      const { data: existingReview, error: reviewErr } = await supabase
        .from('reviews')
        .select('*')
        .eq('work_id', project.id)
        .maybeSingle();

      if (reviewErr) {
        console.error(`Review lookups failed for project: ${project.id}`, reviewErr);
        continue;
      }

      if (existingReview) {
        console.log(`Project ID: ${project.id} already has a review record created.`);
        continue;
      }

      // 3. Generate token & insert pending review record in database
      const token = crypto.randomUUID();
      console.log(`Initializing pending review record for project: ${project.title}`);

      const { error: insertErr } = await supabase
        .from('reviews')
        .insert({
          work_id: project.id,
          client_id: project.client_id,
          token: token,
          status: 'pending',
          rating: 5, // default initial placeholder
          content: ''
        });

      if (insertErr) {
        console.error(`Failed to insert review database record: ${project.id}`, insertErr);
        continue;
      }

      // 4. Send review intake email to client via Resend
      const reviewUrl = `https://haaamid.art/review?token=${token}`;
      const subject = `Review request for your project: ${project.title}`;
      
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #e5e5e5; border-radius: 16px; color: #0a0a0a;">
          <h3 style="color: #7F77DD; font-size: 18px; margin-top: 0;">Hi ${clientName},</h3>
          <p style="font-size: 13px; line-height: 1.6; color: #333;">
            It was a pleasure working with you on the <strong>${project.title}</strong> project!
          </p>
          <p style="font-size: 13px; line-height: 1.6; color: #333;">
            If you have a couple of minutes, I would appreciate it if you could share your feedback. Your review helps support my freelance business and improve my services.
          </p>
          <p style="font-size: 13px; line-height: 1.6; color: #333; margin: 24px 0;">
            <a href="${reviewUrl}" style="display: inline-block; background-color: #7F77DD; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 13px;">
              Leave a Quick Review
            </a>
          </p>
          <p style="font-size: 12px; color: #999; line-height: 1.5; margin: 0;">
            Thanks again for your trust and collaboration!<br><br>
            Best regards,<br>
            <strong>Hamid U V</strong><br>
            <a href="https://haaamid.art" style="color: #7F77DD; text-decoration: none;">haaamid.art</a>
          </p>
        </div>
      `;

      console.log(`Dispatching review request email to: ${email}`);

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: 'Hamid <hamid@haaamid.art>',
          to: email,
          subject: subject,
          html: htmlContent
        })
      });
      console.log(`Email dispatched successfully for project: ${project.title}`);
    }
  } catch (err) {
    console.error('Review requests automation failed:', err);
  }
}

run().catch(console.error);

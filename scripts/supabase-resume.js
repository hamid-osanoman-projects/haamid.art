const { createClient } = require('@supabase/supabase-js');

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const resendKey = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function run() {
  console.log('Checking Supabase projects status...');

  if (!supabaseUrl || !supabaseServiceKey || !accessToken) {
    console.error('Missing required access token or database key credentials.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: projects, error } = await supabase
      .from('supabase_projects')
      .select('*');

    if (error) {
      console.error('Failed to query supabase_projects table:', error);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('No Supabase projects found in database tracker.');
      return;
    }

    console.log(`Analyzing ${projects.length} database trackers...`);

    for (const project of projects) {
      const lastActive = new Date(project.updated_at || Date.now());
      const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

      if (project.status === 'paused' || daysSinceActive > 4) {
        console.log(`Triggering auto-resume restore call on ref: ${project.project_ref}...`);

        const restoreRes = await fetch(`https://api.supabase.com/v1/projects/${project.project_ref}/restore`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (restoreRes.ok) {
          console.log(`Successfully restore signal sent to project: ${project.name}`);

          // Update status in DB
          await supabase
            .from('supabase_projects')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', project.id);

          // Dispatch confirmation alert to Hamid via Resend
          if (resendKey) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`
              },
              body: JSON.stringify({
                from: 'Supabase OS <hamid@haaamid.art>',
                to: 'hamid@haaamid.art',
                subject: `🔄 Supabase Restored: ${project.name}`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e5e5; border-radius: 12px; max-width: 500px;">
                    <h3 style="color: #7F77DD; margin-top: 0;">🔄 Supabase Project Auto-Resumed</h3>
                    <p style="font-size: 13px; color: #333;">
                      The project <strong>${project.name}</strong> (ref: <code>${project.project_ref}</code>) was paused or inactive for more than 4 days.
                    </p>
                    <p style="font-size: 13px; color: #333;">
                      Hamid OS has automatically triggered a restore call to resume the project instance and avoid database pausing.
                    </p>
                  </div>
                `
              })
            });
          }
        } else {
          console.error(`Failed to resume project ${project.name}: status ${restoreRes.status}`);
        }
      }
    }
  } catch (err) {
    console.error('Supabase project auto-resume execution failed:', err);
  }
}

run().catch(console.error);

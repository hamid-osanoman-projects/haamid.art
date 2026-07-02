const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const resendKey = process.env.RESEND_API_KEY;

async function run() {
  console.log('Checking for deadlines due in 2 days...');

  if (!supabaseUrl || !supabaseServiceKey || !resendKey) {
    console.error('Missing required environment keys for deadline reminders.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Calculate date target in exactly 2 days
    const targetDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Querying tasks due on target date: ${targetDate}...`);

    const { data: tasks, error } = await supabase
      .from('works')
      .select('*')
      .eq('due_date', targetDate)
      .neq('status', 'done');

    if (error) {
      console.error('Failed to query tasks from DB:', error);
      return;
    }

    if (!tasks || tasks.length === 0) {
      console.log('No tasks due in 2 days.');
      return;
    }

    console.log(`Found ${tasks.length} tasks due in 2 days. Sending email reminders...`);

    for (const task of tasks) {
      const subject = `⏰ Due in 2 days: ${task.title}`;
      const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #0a0a0a; border: 1px solid #e5e5e5; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #rose-500; margin-top: 0; font-size: 18px;">⏰ Deadline Reminder</h2>
          <p style="font-size: 14px;">The following task is due in <strong>2 days</strong>:</p>
          <div style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 15px; border-radius: 8px;">
            <h3 style="font-size: 14px; margin: 0 0 10px 0;">${task.title}</h3>
            <p style="font-size: 12px; margin: 0; color: #666;">Track: <strong style="text-transform: capitalize;">${task.track}</strong> · Priority: <strong style="text-transform: uppercase;">${task.priority}</strong></p>
          </div>
          <p style="font-size: 11px; margin-top: 20px; color: #999;">
            Log into your dashboard to update status or record metrics: <a href="https://haaamid.art/dashboard" style="color: #7F77DD;">Open Dashboard</a>
          </p>
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: 'Deadlines <hamid@haaamid.art>',
          to: 'hamid@haaamid.art',
          subject: subject,
          html: htmlContent
        })
      });
      console.log(`Alert sent for task ID: ${task.id}`);
    }
  } catch (err) {
    console.error('Deadline reminders script failed:', err);
  }
}

run().catch(console.error);

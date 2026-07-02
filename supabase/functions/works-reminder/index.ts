import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || ""
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

serve(async (req) => {
  // Only allow POST requests (cron or manual triggers)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Calculate dates
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    
    const plus2Days = new Date()
    plus2Days.setDate(plus2Days.getDate() + 2)
    const plus2DaysStr = plus2Days.toISOString().split("T")[0]

    // 1. Fetch overdue tasks
    const { data: overdueTasks } = await supabase
      .from("works")
      .select("title, track, priority, due_date")
      .neq("status", "done")
      .lt("due_date", todayStr)

    // 2. Fetch tasks due today
    const { data: dueTodayTasks } = await supabase
      .from("works")
      .select("title, track, priority, due_date")
      .neq("status", "done")
      .eq("due_date", todayStr)

    // 3. Fetch tasks due in 2 days
    const { data: dueSoonTasks } = await supabase
      .from("works")
      .select("title, track, priority, due_date")
      .neq("status", "done")
      .eq("due_date", plus2DaysStr)

    // 4. Fetch overdue freelance invoices
    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select("invoice_number, amount, currency, due_date, works(title)")
      .eq("status", "unpaid")
      .lt("due_date", todayStr)

    // 5. Monday Carry Over Tasks Summary
    let carryOverHtml = ""
    const isMonday = today.getDay() === 1
    if (isMonday) {
      const lastMonday = new Date()
      lastMonday.setDate(lastMonday.getDate() - 7)
      const lastMondayStr = lastMonday.toISOString().split("T")[0]

      const { data: lastPlan } = await supabase
        .from("weekly_plans")
        .select("goals, notes")
        .eq("week_start", lastMondayStr)
        .maybeSingle()

      if (lastPlan) {
        carryOverHtml = `
          <div style="margin-top: 24px; padding: 20px; border: 1px dashed #7F77DD; border-radius: 12px; bg: #faf5ff;">
            <h3 style="color: #7F77DD; font-size: 14px; margin-top: 0;">Monday Carry-Over Tasks</h3>
            <p style="font-size: 12px; color: #555;">Review goals from last week's planner (Week of ${lastMondayStr}):</p>
            <ul style="padding-left: 20px; font-size: 12px; color: #333;">
              ${(lastPlan.goals || []).map((g: string) => `<li>${g}</li>`).join("") || "<li>No primary goals were logged</li>"}
            </ul>
          </div>
        `
      }
    }

    // Build the email HTML report
    let emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px;">
        <h2 style="font-size: 20px; font-weight: 800; color: #7F77DD; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; margin-bottom: 20px;">
          Daily Works & Deliverables Summary
        </h2>
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 24px;">Muscat Time 8:00 AM · ${today.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
    `

    // Overdue tasks
    if (overdueTasks && overdueTasks.length > 0) {
      emailHtml += `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #ef4444; font-size: 14px; margin-bottom: 8px;">⚠️ Overdue Tasks (${overdueTasks.length})</h3>
          <ul style="padding-left: 20px; font-size: 12px; margin: 0;">
            ${overdueTasks.map(t => `<li><strong>[${t.track}]</strong> ${t.title} (Due: ${t.due_date})</li>`).join("")}
          </ul>
        </div>
      `
    }

    // Due today tasks
    if (dueTodayTasks && dueTodayTasks.length > 0) {
      emailHtml += `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #f59e0b; font-size: 14px; margin-bottom: 8px;">📅 Due Today Tasks (${dueTodayTasks.length})</h3>
          <ul style="padding-left: 20px; font-size: 12px; margin: 0;">
            ${dueTodayTasks.map(t => `<li><strong>[${t.track}]</strong> ${t.title}</li>`).join("")}
          </ul>
        </div>
      `
    }

    // Due soon tasks
    if (dueSoonTasks && dueSoonTasks.length > 0) {
      emailHtml += `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #3b82f6; font-size: 14px; margin-bottom: 8px;">🔔 Due Soon Tasks (In 2 Days)</h3>
          <ul style="padding-left: 20px; font-size: 12px; margin: 0;">
            ${dueSoonTasks.map(t => `<li><strong>[${t.track}]</strong> ${t.title}</li>`).join("")}
          </ul>
        </div>
      `
    }

    // Overdue Invoices
    if (overdueInvoices && overdueInvoices.length > 0) {
      emailHtml += `
        <div style="margin-bottom: 20px; padding-top: 12px; border-top: 1px solid #f3f4f6;">
          <h3 style="color: #dc2626; font-size: 14px; margin-bottom: 8px;">💸 Overdue Invoices (${overdueInvoices.length})</h3>
          <ul style="padding-left: 20px; font-size: 12px; margin: 0;">
            ${overdueInvoices.map(i => `<li><strong>Invoice #${i.invoice_number}</strong>: ${i.amount} ${i.currency} for "${(i.works as any)?.title || 'Project'}" (Due: ${i.due_date})</li>`).join("")}
          </ul>
        </div>
      `
    }

    // Append monday carryover if exists
    emailHtml += carryOverHtml

    // Footer info
    emailHtml += `
        <p style="font-size: 11px; color: #9ca3af; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          This automated daily digest is dispatched from haaamid.art Works Planner Engine.
        </p>
      </div>
    `

    // Dispatch email via Resend
    if (RESEND_API_KEY) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "hamid@haaamid.art",
          to: "hamid.osanoman@gmail.com",
          subject: `Daily Works Summary & Alerts — ${todayStr}`,
          html: emailHtml
        })
      })

      if (!emailResponse.ok) {
        const errText = await emailResponse.text()
        return new Response(JSON.stringify({ error: `Resend dispatch failed: ${errText}` }), { status: 500 })
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Summary generated and dispatched." }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

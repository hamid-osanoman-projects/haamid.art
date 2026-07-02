import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; tid: string }> }
) {
  const { id, tid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership of the parent work
  const { data: work, error: fetchErr } = await supabase
    .from('works')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (fetchErr || !work || work.user_id !== user.id) {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 })
  }

  // Fetch the log to record details for the activity log (optional but helpful)
  const { data: log } = await supabase
    .from('work_time_logs')
    .select('hours, description')
    .eq('id', tid)
    .single()

  const { error: deleteErr } = await supabase
    .from('work_time_logs')
    .delete()
    .eq('id', tid)
    .eq('work_id', id)

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  }

  // Log removal in updates
  if (log) {
    const comment = log.description ? `: ${log.description}` : ''
    await supabase.from('work_updates').insert({
      work_id: id,
      content: `Removed logged time of ${log.hours}h${comment}`
    })
  }

  return NextResponse.json({ success: true })
}

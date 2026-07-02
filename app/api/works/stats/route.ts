import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'week' // week | month | quarter | year | all
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Calculate start date based on range
  const now = new Date()
  let fromDate = new Date()
  if (range === 'week') {
    fromDate.setDate(now.getDate() - 7)
  } else if (range === 'month') {
    fromDate.setMonth(now.getMonth() - 1)
  } else if (range === 'quarter') {
    fromDate.setMonth(now.getMonth() - 3)
  } else if (range === 'year') {
    fromDate.setFullYear(now.getFullYear() - 1)
  } else {
    fromDate = new Date('2000-01-01')
  }

  const fromDateStr = fromDate.toISOString().split('T')[0]
  const fromDateTimeStr = fromDate.toISOString()

  try {
    const [worksRes, logsRes] = await Promise.all([
      supabase
        .from('works')
        .select('status, track, priority, due_date, completed_at')
        .eq('user_id', user.id),
      supabase
        .from('work_time_logs')
        .select('date, hours, work_id')
        .eq('user_id', user.id)
        .gte('date', fromDateStr)
    ])

    if (worksRes.error) throw worksRes.error
    if (logsRes.error) throw logsRes.error

    const works = worksRes.data || []
    const logs = logsRes.data || []

    // Calculate status counts
    const byStatus = works.reduce((acc, w) => {
      const status = w.status || 'backlog'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate track counts
    const byTrack = works.reduce((acc, w) => {
      const track = w.track || 'company'
      acc[track] = (acc[track] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate priority counts for active tasks (not done)
    const byPriority = works
      .filter(w => w.status !== 'done')
      .reduce((acc, w) => {
        const priority = w.priority || 'medium'
        acc[priority] = (acc[priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    // Calculate total hours logged in range
    const totalHours = logs.reduce((sum, l) => sum + Number(l.hours || 0), 0)

    // Calculate completed count in range
    const completedCount = works.filter(w => {
      return w.status === 'done' && w.completed_at && w.completed_at >= fromDateTimeStr
    }).length

    return NextResponse.json({
      byStatus,
      byTrack,
      byPriority,
      totalHours,
      hoursByDay: logs,
      completedCount
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate statistics' }, { status: 500 })
  }
}

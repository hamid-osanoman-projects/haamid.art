'use client'

import React, { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, CheckSquare, Plus, Save, Clock, Calendar, CheckCircle2, Circle, Loader2, Sparkles
} from 'lucide-react'

interface Task {
  id: string
  title: string
  track: 'company' | 'freelance' | 'personal'
  status: string
  priority: string
  due_date: string | null
}

interface WeeklyPlan {
  id?: string
  week_start: string
  goals: string[]
  notes: string
  review_notes: string
  tasks_planned: number
  tasks_completed: number
  hours_logged: number
}

interface TimeLog {
  id: string
  date: string
  hours: number
  description: string
  works?: {
    track: string
  }
}

export default function WeeklyPlannerPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    return new Date(today.setDate(diff))
  })

  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Goal & Notes states
  const [goals, setGoals] = useState<string[]>(['', '', ''])
  const [notes, setNotes] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [isSavingPlan, setIsSavingPlan] = useState(false)

  // Quick log time states
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [logHours, setLogHours] = useState('')
  const [logDesc, setLogDesc] = useState('')
  const [isLoggingTime, setIsLoggingTime] = useState(false)

  const weekStartStr = currentWeekStart.toISOString().split('T')[0]
  
  // Calculate Sunday of this week
  const sunday = new Date(currentWeekStart)
  sunday.setDate(sunday.getDate() + 6)
  const weekEndStr = sunday.toISOString().split('T')[0]

  useEffect(() => {
    fetchWeekData()
  }, [currentWeekStart])

  async function fetchWeekData() {
    setIsLoading(true)
    try {
      // 1. Fetch weekly plan
      const planRes = await fetch(`/api/works/week?week_start=${weekStartStr}`)
      if (planRes.ok) {
        const { plan: fetchedPlan } = await planRes.json()
        if (fetchedPlan) {
          setPlan(fetchedPlan)
          setGoals([
            fetchedPlan.goals?.[0] || '',
            fetchedPlan.goals?.[1] || '',
            fetchedPlan.goals?.[2] || ''
          ])
          setNotes(fetchedPlan.notes || '')
          setReviewNotes(fetchedPlan.review_notes || '')
        } else {
          setPlan(null)
          setGoals(['', '', ''])
          setNotes('')
          setReviewNotes('')
        }
      }

      // 2. Fetch works due or active this week
      const worksRes = await fetch('/api/works')
      if (worksRes.ok) {
        const { works } = await worksRes.json()
        const weekTasks = (works as Task[]).filter(t => {
          // Status is active OR due date falls within this Mon-Sun week
          if (t.status === 'this_week' || t.status === 'in_progress') return true
          if (t.due_date) {
            const due = new Date(t.due_date)
            const start = new Date(currentWeekStart)
            start.setHours(0, 0, 0, 0)
            const end = new Date(sunday)
            end.setHours(23, 59, 59, 999)
            return due >= start && due <= end
          }
          return false
        })
        setTasks(weekTasks)
      }

      // 3. Fetch time logs for this week range
      const timeRes = await fetch('/api/works/time')
      if (timeRes.ok) {
        const { logs } = await timeRes.json()
        const weekLogs = (logs as TimeLog[]).filter(l => {
          const logDate = new Date(l.date)
          const start = new Date(currentWeekStart)
          start.setHours(0, 0, 0, 0)
          const end = new Date(sunday)
          end.setHours(23, 59, 59, 999)
          return logDate >= start && logDate <= end
        })
        setTimeLogs(weekLogs)
      }

    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  function handleNavigateWeek(direction: 'prev' | 'next' | 'today') {
    const nextDate = new Date(currentWeekStart)
    if (direction === 'prev') {
      nextDate.setDate(nextDate.getDate() - 7)
    } else if (direction === 'next') {
      nextDate.setDate(nextDate.getDate() + 7)
    } else {
      const today = new Date()
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      nextDate.setTime(new Date(today.setDate(diff)).getTime())
    }
    setCurrentWeekStart(nextDate)
  }

  async function handleSavePlan() {
    setIsSavingPlan(true)
    const completedTasksCount = tasks.filter(t => t.status === 'done').length
    const totalHoursLogged = timeLogs.reduce((sum, l) => sum + Number(l.hours || 0), 0)

    try {
      const res = await fetch('/api/works/week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start: weekStartStr,
          goals: goals.filter(g => g.trim() !== ''),
          notes,
          review_notes: reviewNotes,
          tasks_planned: tasks.length,
          tasks_completed: completedTasksCount,
          hours_logged: totalHoursLogged
        })
      })

      if (res.ok) {
        const data = await res.json()
        setPlan(data.plan)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSavingPlan(false)
    }
  }

  async function handleToggleComplete(task: Task) {
    const newStatus = task.status === 'done' ? 'in_progress' : 'done'
    setTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
    )

    await fetch(`/api/works/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    fetchWeekData()
  }

  async function handleQuickLogTime(e: React.FormEvent) {
    e.preventDefault()
    const parsedHours = parseFloat(logHours)
    if (!selectedTaskId || isNaN(parsedHours) || parsedHours <= 0 || isLoggingTime) return

    setIsLoggingTime(true)
    try {
      const res = await fetch('/api/works/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_id: selectedTaskId,
          hours: parsedHours,
          description: logDesc.trim(),
          date: new Date().toISOString().split('T')[0]
        })
      })

      if (res.ok) {
        setLogHours('')
        setLogDesc('')
        fetchWeekData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoggingTime(false)
    }
  }

  // Group tasks by track
  const companyTasks = tasks.filter(t => t.track === 'company')
  const freelanceTasks = tasks.filter(t => t.track === 'freelance')
  const personalTasks = tasks.filter(t => t.track === 'personal')

  // Calculate stats
  const totalLoggedHours = timeLogs.reduce((sum, l) => sum + Number(l.hours || 0), 0)
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  // Calculate daily time totals for chart
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dailyHours = daysOfWeek.map((dayName, index) => {
    const targetDate = new Date(currentWeekStart)
    targetDate.setDate(targetDate.getDate() + index)
    const dateStr = targetDate.toISOString().split('T')[0]

    const dayLogs = timeLogs.filter(l => l.date === dateStr)
    const company = dayLogs.filter(l => l.works?.track === 'company').reduce((s, l) => s + Number(l.hours), 0)
    const freelance = dayLogs.filter(l => l.works?.track === 'freelance').reduce((s, l) => s + Number(l.hours), 0)
    const personal = dayLogs.filter(l => l.works?.track === 'personal').reduce((s, l) => s + Number(l.hours), 0)
    const total = dayLogs.reduce((s, l) => s + Number(l.hours), 0)

    return { dayName, company, freelance, personal, total }
  })

  const maxDaily = Math.max(...dailyHours.map(d => d.total), 4) // minimum height scale helper

  return (
    <div className="space-y-6 max-w-full">
      {/* Week Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-black text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <span>Weekly Planner & Review</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Week of {currentWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigateWeek('prev')}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-500/5 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleNavigateWeek('today')}
            className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 text-xs font-bold rounded-xl hover:bg-zinc-500/5 cursor-pointer"
          >
            This Week
          </button>
          <button
            onClick={() => handleNavigateWeek('next')}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-500/5 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
          <span className="text-xs font-semibold">Loading weekly planner...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE (60%): Goals and Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Week goals */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>Primary Goals This Week</span>
              </h3>

              <div className="space-y-3">
                {goals.map((goal, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-black text-purple-500 w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={goal}
                      onChange={e => {
                        const newGoals = [...goals]
                        newGoals[idx] = e.target.value
                        setGoals(newGoals)
                      }}
                      placeholder={`Goal #${idx + 1}`}
                      className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 focus:bg-white transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Task list by track */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-5">
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                This Week's Deliverables
              </h3>

              {tasks.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-400">
                  No deliverables scheduled for this week.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Company */}
                  {companyTasks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Company tasks</h4>
                      <div className="space-y-1.5">
                        {companyTasks.map(t => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between p-2.5 hover:bg-zinc-500/5 rounded-xl cursor-pointer"
                            onClick={() => handleToggleComplete(t)}
                          >
                            <div className="flex items-center gap-2.5">
                              {t.status === 'done' ? (
                                <CheckCircle2 className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="h-4.5 w-4.5 text-zinc-300 dark:text-zinc-750 flex-shrink-0" />
                              )}
                              <span className={`text-xs ${t.status === 'done' ? 'line-through text-zinc-450' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                {t.title}
                              </span>
                            </div>
                            {t.due_date && (
                              <span className="text-[10px] text-zinc-400">{new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Freelance */}
                  {freelanceTasks.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Freelance tasks</h4>
                      <div className="space-y-1.5">
                        {freelanceTasks.map(t => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between p-2.5 hover:bg-zinc-500/5 rounded-xl cursor-pointer"
                            onClick={() => handleToggleComplete(t)}
                          >
                            <div className="flex items-center gap-2.5">
                              {t.status === 'done' ? (
                                <CheckCircle2 className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="h-4.5 w-4.5 text-zinc-300 dark:text-zinc-750 flex-shrink-0" />
                              )}
                              <span className={`text-xs ${t.status === 'done' ? 'line-through text-zinc-450' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                {t.title}
                              </span>
                            </div>
                            {t.due_date && (
                              <span className="text-[10px] text-zinc-400">{new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personal */}
                  {personalTasks.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Personal tasks</h4>
                      <div className="space-y-1.5">
                        {personalTasks.map(t => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between p-2.5 hover:bg-zinc-500/5 rounded-xl cursor-pointer"
                            onClick={() => handleToggleComplete(t)}
                          >
                            <div className="flex items-center gap-2.5">
                              {t.status === 'done' ? (
                                <CheckCircle2 className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="h-4.5 w-4.5 text-zinc-300 dark:text-zinc-750 flex-shrink-0" />
                              )}
                              <span className={`text-xs ${t.status === 'done' ? 'line-through text-zinc-450' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                {t.title}
                              </span>
                            </div>
                            {t.due_date && (
                              <span className="text-[10px] text-zinc-400">{new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save plan action */}
            <div className="flex justify-end">
              <button
                onClick={handleSavePlan}
                disabled={isSavingPlan}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-50"
              >
                {isSavingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Weekly Report</span>
              </button>
            </div>
          </div>

          {/* RIGHT SIDE (40%): Time log & Sunday Review */}
          <div className="space-y-6">
            {/* Hours logged bar chart */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Logged Time Breakdown
                </h3>
                <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                  {totalLoggedHours}h total
                </span>
              </div>

              {/* Pure SVG Custom Bar Chart */}
              <div className="h-32 flex items-end justify-between gap-1 pt-4 relative">
                {dailyHours.map((d, idx) => {
                  const companyPct = (d.company / maxDaily) * 100
                  const freelancePct = (d.freelance / maxDaily) * 100
                  const personalPct = (d.personal / maxDaily) * 100

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group cursor-help">
                      <div className="w-full relative h-20 flex flex-col justify-end rounded-t-md overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                        {/* Company track hours segment */}
                        <div
                          className="bg-purple-500 transition-all duration-500"
                          style={{ height: `${companyPct}%` }}
                          title={`Company: ${d.company}h`}
                        />
                        {/* Freelance track hours segment */}
                        <div
                          className="bg-green-500 transition-all duration-500"
                          style={{ height: `${freelancePct}%` }}
                          title={`Freelance: ${d.freelance}h`}
                        />
                        {/* Personal track hours segment */}
                        <div
                          className="bg-blue-500 transition-all duration-500"
                          style={{ height: `${personalPct}%` }}
                          title={`Personal: ${d.personal}h`}
                        />
                      </div>
                      <span className="text-[9px] text-zinc-400 font-bold">{d.dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Log widget */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Quick Log Time
              </h3>

              <form onSubmit={handleQuickLogTime} className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Select Task</label>
                  <select
                    value={selectedTaskId}
                    onChange={e => setSelectedTaskId(e.target.value)}
                    required
                    className="w-full mt-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                  >
                    <option value="">Choose task...</option>
                    {tasks.filter(t => t.status !== 'done').map(t => (
                      <option key={t.id} value={t.id}>[{t.track}] {t.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Hours</label>
                    <input
                      type="number"
                      step="0.1"
                      value={logHours}
                      onChange={e => setLogHours(e.target.value)}
                      required
                      placeholder="0.0"
                      className="w-full mt-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                    <input
                      type="text"
                      value={logDesc}
                      onChange={e => setLogDesc(e.target.value)}
                      placeholder="Log details..."
                      className="w-full mt-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!selectedTaskId || !logHours || isLoggingTime}
                  className="w-full text-xs font-bold py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isLoggingTime ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                  <span>Log Hours</span>
                </button>
              </form>
            </div>

            {/* Sunday Review or Past Week retrospection */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                End-of-Week Retrospective
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Reflection / Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Reflect on wins, blocks, or items to carry over..."
                    rows={4}
                    className="w-full mt-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none resize-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar, ClipboardList, Briefcase, FileText, Database, UserCheck,
  Flame, ChevronRight, Play, Plus, Clock, AlertTriangle, CheckSquare2,
  X, Loader2, DollarSign, Send, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Task {
  id: string
  title: string
  track: 'company' | 'freelance' | 'personal'
  status: string
  priority: string
  due_date: string | null
  blocked_reason?: string
}

interface SupabaseProject {
  id: string
  name: string
  status: string
  project_ref: string
}

interface TimeLog {
  id: string
  hours: number
  date: string
  description: string
}

interface Invoice {
  id: string
  amount: number
  status: 'paid' | 'unpaid' | 'overdue'
  paid_at: string | null
  created_at: string
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [supabaseProjects, setSupabaseProjects] = useState<SupabaseProject[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Blocked banner dismiss state
  const [isBlockedDismissed, setIsBlockedDismissed] = useState(false)

  // Quick Log Time
  const [quickLogTaskId, setQuickLogTaskId] = useState('')
  const [quickLogHours, setQuickLogHours] = useState('')
  const [quickLogDesc, setQuickLogDesc] = useState('')
  const [isLogging, setIsLogging] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setIsLoading(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]

      // Parallel data fetching
      const [tasksRes, meetingsRes, supabaseRes, invoicesRes, logsRes] = await Promise.all([
        supabase.from('works').select('*'),
        supabase.from('meetings').select('*').eq('status', 'upcoming').order('scheduled_at', { ascending: true }),
        supabase.from('supabase_projects').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('work_time_logs').select('*')
      ])

      if (tasksRes.data) setTasks(tasksRes.data as Task[])
      if (meetingsRes.data) {
        const mappedMeetings = meetingsRes.data.map(m => ({
          id: m.id,
          time: new Date(m.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
          client: m.title,
          type: m.type,
          title: m.notes || 'Meeting Session'
        }))
        setMeetings(mappedMeetings)
      }
      if (supabaseRes.data) setSupabaseProjects(supabaseRes.data as SupabaseProject[])
      if (invoicesRes.data) setInvoices(invoicesRes.data as Invoice[])
      if (logsRes.data) setTimeLogs(logsRes.data as TimeLog[])

    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleQuickLog(e: React.FormEvent) {
    e.preventDefault()
    const parsedHours = parseFloat(quickLogHours)
    if (!quickLogTaskId || isNaN(parsedHours) || parsedHours <= 0 || isLogging) return

    setIsLogging(true)
    try {
      const res = await fetch('/api/works/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_id: quickLogTaskId,
          hours: parsedHours,
          description: quickLogDesc.trim(),
          date: new Date().toISOString().split('T')[0]
        })
      })
      if (res.ok) {
        setQuickLogHours('')
        setQuickLogDesc('')
        fetchDashboardData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLogging(false)
    }
  }

  // Calculate statistics
  const todayStr = new Date().toISOString().split('T')[0]
  const dueTasksCount = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date <= todayStr).length
  const activeProjectsCount = tasks.filter(t => t.track === 'freelance' && t.status === 'in_progress').length
  
  // Overdue deliverables list
  const overdueTasks = tasks
    .filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr)
    .map(t => {
      const dueDays = Math.ceil((new Date(t.due_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return {
        id: t.id,
        title: t.title,
        track: t.track,
        priority: t.priority,
        due: dueDays < 0 ? `${Math.abs(dueDays)}d overdue` : 'Overdue'
      }
    })

  // Upcoming deadlines timeline (next 5 tasks across all tracks with due date >= today)
  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'done' && t.due_date && t.due_date >= todayStr)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)

  // Blocked tasks
  const blockedTasks = tasks.filter(t => t.status === 'blocked')

  // MTD Freelance revenue
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0,0,0,0)

  const mtdCollected = invoices
    .filter(inv => inv.status === 'paid' && inv.paid_at && new Date(inv.paid_at) >= startOfMonth)
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0)

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0)

  // Time logged today
  const timeToday = timeLogs
    .filter(l => l.date === todayStr)
    .reduce((sum, l) => sum + Number(l.hours || 0), 0)

  // Weekly stats
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const completedWeeklyTasks = tasks.filter(t => t.status === 'done').length // simplifed metrics count
  const hoursWeeklyLogged = timeLogs
    .filter(l => new Date(l.date) >= oneWeekAgo)
    .reduce((sum, l) => sum + Number(l.hours || 0), 0)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
        <span className="text-xs font-semibold">Generating dashboard metrics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none font-sans max-w-full">
      {/* Dismissable Blocked alert banner */}
      {blockedTasks.length > 0 && !isBlockedDismissed && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start justify-between gap-3 text-red-500 relative animate-in fade-in slide-in-from-top-4">
          <div className="flex gap-2.5">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black">Attention: You have {blockedTasks.length} blocked task{blockedTasks.length !== 1 ? 's' : ''}!</p>
              <div className="mt-1 space-y-1">
                {blockedTasks.map(t => (
                  <p key={t.id} className="text-[11px] font-semibold opacity-90">
                    · <span className="underline">{t.title}</span> {t.blocked_reason ? `(${t.blocked_reason})` : ''}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => setIsBlockedDismissed(true)} className="text-red-400 hover:text-red-600 cursor-pointer">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#141414] p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-650 dark:text-purple-400">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Due Tasks</p>
            <h3 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{dueTasksCount}</h3>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#141414] p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Meetings Today</p>
            <h3 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{meetings.length}</h3>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#141414] p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Active Projects</p>
            <h3 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{activeProjectsCount}</h3>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#141414] p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Revenue collected</p>
            <h3 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{mtdCollected} <span className="text-xs text-zinc-400 font-bold">OMR</span></h3>
          </div>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left column (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Section 1: Upcoming Deadlines Timeline */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5 text-purple-500" />
                <span>Upcoming Deadlines Timeline</span>
              </h3>
            </div>

            <div className="relative pl-6 border-l border-zinc-200 dark:border-zinc-800 space-y-6 py-2">
              {upcomingDeadlines.map(task => (
                <div key={task.id} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[30px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-purple-500 bg-white dark:bg-zinc-950" />
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{task.title}</h4>
                      <p className="text-[10px] text-zinc-450 uppercase font-bold mt-0.5">
                        Track: {task.track} · Priority: {task.priority}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-550/5 px-2 py-1 rounded-lg">
                      {new Date(task.due_date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}

              {upcomingDeadlines.length === 0 && (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No upcoming deadlines.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Meetings */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#141414] p-6">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-purple-400" />
                <span>Today's Meetings</span>
              </h3>
            </div>
            
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{meeting.title}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Client: <span className="font-semibold">{meeting.client}</span> · Type: <span className="capitalize">{meeting.type.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md">
                    <Clock className="h-3 w-3" />
                    <span>{meeting.time}</span>
                  </span>
                </div>
              ))}

              {meetings.length === 0 && (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No meetings scheduled for today.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Overdue tasks */}
          {overdueTasks.length > 0 && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#141414] p-6">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <ClipboardList className="h-4.5 w-4.5 text-rose-400" />
                  <span>Overdue Tasks</span>
                </h3>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {overdueTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{task.title}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Track: <span className="capitalize font-semibold">{task.track}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        task.priority === 'urgent'
                          ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                          : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/5 px-2 py-1 rounded-md">
                        {task.due}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Card 1: Time Today Widget with quick log */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Time Log Today
              </h3>
              <span className="text-xs font-black text-purple-650 dark:text-purple-400">
                {timeToday}h logged
              </span>
            </div>

            <form onSubmit={handleQuickLog} className="space-y-3.5 pt-2">
              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Select Project/Task</label>
                <select
                  value={quickLogTaskId}
                  onChange={e => setQuickLogTaskId(e.target.value)}
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
                    value={quickLogHours}
                    onChange={e => setQuickLogHours(e.target.value)}
                    required
                    placeholder="0.0"
                    className="w-full mt-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    value={quickLogDesc}
                    onChange={e => setQuickLogDesc(e.target.value)}
                    placeholder="Details..."
                    className="w-full mt-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!quickLogTaskId || !quickLogHours || isLogging}
                className="w-full text-xs font-bold py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isLogging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>Log Time</span>
              </button>
            </form>
          </div>

          {/* Card 2: Freelance revenue widget */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Freelance Billings (MTD)
            </h3>

            <div className="space-y-4">
              <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                <p className="text-[9px] font-bold text-green-600 uppercase tracking-wider">Collected Revenue</p>
                <p className="text-lg font-black text-green-600 mt-1">{mtdCollected} OMR</p>
              </div>
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Outstanding Billings</p>
                <p className="text-lg font-black text-amber-600 mt-1">{totalOutstanding} OMR</p>
              </div>
            </div>
          </div>

          {/* Card 3: Weekly Summary */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#141414] p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <Flame className="h-4.5 w-4.5 text-amber-500" />
              <span>Weekly Summary</span>
            </h3>

            <div className="space-y-4 text-xs font-semibold text-zinc-500">
              <div className="flex justify-between items-center">
                <span>Completed Tasks</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-100">{completedWeeklyTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Weekly Hours</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-100">{hoursWeeklyLogged}h</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

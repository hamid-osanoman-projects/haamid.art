'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar, Clock, Download, Plus, Trash2, Loader2, Sparkles, AlertCircle, X
} from 'lucide-react'

interface TimeLog {
  id: string
  work_id: string
  hours: number
  description: string
  date: string
  created_at: string
  works: {
    title: string
    track: 'company' | 'freelance' | 'personal'
    color: string
    icon: string
  } | null
}

interface TaskOption {
  id: string
  title: string
  track: 'company' | 'freelance' | 'personal'
}

type RangeOption = 'today' | 'week' | 'month' | 'year' | 'all'

export default function TimeTrackingPage() {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [tasks, setTasks] = useState<TaskOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeRange, setActiveRange] = useState<RangeOption>('week')

  // Log Modal States
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [logHours, setLogHours] = useState('')
  const [logDesc, setLogDesc] = useState('')
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isSavingLog, setIsSavingLog] = useState(false)

  useEffect(() => {
    fetchLogs()
    fetchTaskOptions()
  }, [])

  async function fetchLogs() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/works/time')
      if (res.ok) {
        const { logs: fetchedLogs } = await res.json()
        setLogs(fetchedLogs || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchTaskOptions() {
    try {
      const res = await fetch('/api/works')
      if (res.ok) {
        const { works } = await res.json()
        setTasks((works as TaskOption[]).filter(w => w.track))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filter logs by date range in memory
  const filteredLogs = logs.filter(log => {
    const now = new Date()
    const logDate = new Date(log.date)

    if (activeRange === 'today') {
      const todayStr = now.toISOString().split('T')[0]
      return log.date === todayStr
    }

    if (activeRange === 'week') {
      const diff = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
      const startOfWeek = new Date(now.setDate(diff))
      startOfWeek.setHours(0,0,0,0)
      return logDate >= startOfWeek
    }

    if (activeRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return logDate >= startOfMonth
    }

    if (activeRange === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      return logDate >= startOfYear
    }

    return true // all
  })

  // Grouped metrics
  const totalHours = filteredLogs.reduce((sum, l) => sum + Number(l.hours || 0), 0)
  const companyHours = filteredLogs.filter(l => l.works?.track === 'company').reduce((sum, l) => sum + Number(l.hours || 0), 0)
  const freelanceHours = filteredLogs.filter(l => l.works?.track === 'freelance').reduce((sum, l) => sum + Number(l.hours || 0), 0)
  const personalHours = filteredLogs.filter(l => l.works?.track === 'personal').reduce((sum, l) => sum + Number(l.hours || 0), 0)

  // Average daily calculation based on unique logged dates
  const uniqueDates = Array.from(new Set(filteredLogs.map(l => l.date)))
  const avgDaily = uniqueDates.length > 0 ? (totalHours / uniqueDates.length).toFixed(1) : '0'

  async function handleCreateLog(e: React.FormEvent) {
    e.preventDefault()
    const parsedHours = parseFloat(logHours)
    if (!selectedTaskId || isNaN(parsedHours) || parsedHours <= 0 || isSavingLog) return

    setIsSavingLog(true)
    try {
      const res = await fetch('/api/works/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_id: selectedTaskId,
          hours: parsedHours,
          description: logDesc.trim(),
          date: logDate
        })
      })

      if (res.ok) {
        setLogHours('')
        setLogDesc('')
        setIsLogOpen(false)
        fetchLogs()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSavingLog(false)
    }
  }

  async function handleDeleteLog(logId: string, workId: string) {
    if (!confirm('Are you sure you want to delete this log entry?')) return
    setLogs(prev => prev.filter(l => l.id !== logId))
    try {
      await fetch(`/api/works/${workId}/time/${logId}`, { method: 'DELETE' })
    } catch (err) {
      console.error(err)
      fetchLogs()
    }
  }

  // Export to CSV
  function handleExportCSV() {
    const headers = 'ID,Date,Task,Track,Hours,Description\n'
    const csvContent = filteredLogs.map(l => {
      const title = l.works?.title.replace(/"/g, '""') || ''
      const desc = l.description.replace(/"/g, '""') || ''
      return `"${l.id}","${l.date}","${title}","${l.works?.track || ''}",${l.hours},"${desc}"`
    }).join('\n')

    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `time_logs_${activeRange}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Group last 7 days of logs for chart representation
  const last7DaysList = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date()
    d.setDate(d.getDate() - idx)
    return d.toISOString().split('T')[0]
  }).reverse()

  const chartData = last7DaysList.map(dateStr => {
    const dayLogs = logs.filter(l => l.date === dateStr)
    const company = dayLogs.filter(l => l.works?.track === 'company').reduce((s, l) => s + Number(l.hours), 0)
    const freelance = dayLogs.filter(l => l.works?.track === 'freelance').reduce((s, l) => s + Number(l.hours), 0)
    const personal = dayLogs.filter(l => l.works?.track === 'personal').reduce((s, l) => s + Number(l.hours), 0)
    const total = dayLogs.reduce((s, l) => s + Number(l.hours), 0)
    
    const dayName = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' })
    return { dayName, company, freelance, personal, total }
  })

  const maxChartVal = Math.max(...chartData.map(c => c.total), 4)

  return (
    <div className="space-y-6 max-w-full relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
            Time & Analytics
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Analyze time spent on client jobs, company tasks, and learning courses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/5 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsLogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/10 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Log Time</span>
          </button>
        </div>
      </div>

      {/* Date Range selectors */}
      <div className="flex items-center gap-2">
        {([
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'year', label: 'This Year' },
          { key: 'all', label: 'All Time' }
        ] as const).map(range => (
          <button
            key={range.key}
            onClick={() => setActiveRange(range.key)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeRange === range.key
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total logged</p>
            <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">{totalHours}h</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-purple-550/10 text-purple-550 rounded-xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Company</p>
            <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">{companyHours}h</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-green-500/10 text-green-600 rounded-xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Freelance</p>
            <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">{freelanceHours}h</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Personal</p>
            <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">{personalHours}h</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Daily Avg</p>
            <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">{avgDaily}h</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
          <span className="text-xs font-semibold">Loading logs...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Logs Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-550 font-bold">
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Task / Project</th>
                      <th className="p-3.5 text-center">Track</th>
                      <th className="p-3.5 text-center">Hours</th>
                      <th className="p-3.5 w-[35%] hidden sm:table-cell">Description</th>
                      <th className="p-3.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-zinc-500/5">
                        <td className="p-3.5 text-zinc-500 whitespace-nowrap">
                          {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                          <span className="mr-1">{log.works?.icon}</span>
                          {log.works?.title || 'Unknown Work Item'}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`}
                            style={{
                              backgroundColor: (log.works?.color || '#737373') + '15',
                              color: log.works?.color || '#737373'
                            }}
                          >
                            {log.works?.track || 'company'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-purple-650 dark:text-purple-400">
                          {log.hours}h
                        </td>
                        <td className="p-3.5 text-zinc-500 leading-relaxed max-w-[200px] truncate hidden sm:table-cell">
                          {log.description || '—'}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleDeleteLog(log.id, log.work_id)}
                            className="text-zinc-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-zinc-450">
                          No logged entries during this date filter match.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Side: Charts breakdown */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Daily Tracker Activity (Last 7 Days)
              </h3>

              {/* Custom SVG Column Bar Graph */}
              <div className="h-44 flex items-end justify-between gap-1 pt-6">
                {chartData.map((d, index) => {
                  const companyPct = (d.company / maxChartVal) * 100
                  const freelancePct = (d.freelance / maxChartVal) * 100
                  const personalPct = (d.personal / maxChartVal) * 100

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1.5 group cursor-help">
                      <div className="w-full relative h-28 flex flex-col justify-end rounded-t-md overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                        <div
                          className="bg-purple-500 transition-all duration-500"
                          style={{ height: `${companyPct}%` }}
                          title={`Company: ${d.company}h`}
                        />
                        <div
                          className="bg-green-500 transition-all duration-500"
                          style={{ height: `${freelancePct}%` }}
                          title={`Freelance: ${d.freelance}h`}
                        />
                        <div
                          className="bg-blue-500 transition-all duration-500"
                          style={{ height: `${personalPct}%` }}
                          title={`Personal: ${d.personal}h`}
                        />
                      </div>
                      <span className="text-[9px] text-zinc-450 font-bold">{d.dayName}</span>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex justify-center items-center gap-4 text-[9px] font-bold text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-purple-500 rounded" />
                  <span>Company</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-500 rounded" />
                  <span>Freelance</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-blue-500 rounded" />
                  <span>Personal</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Log Modal Overlay */}
      {isLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setIsLogOpen(false)}>
          <div
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Log Hours</h3>
              <button onClick={() => setIsLogOpen(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Project/Task *</label>
                <select
                  value={selectedTaskId}
                  onChange={e => setSelectedTaskId(e.target.value)}
                  required
                  className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                >
                  <option value="">Choose task...</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>[{t.track}] {t.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    required
                    className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hours *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={logHours}
                    onChange={e => setLogHours(e.target.value)}
                    required
                    placeholder="0.0"
                    className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  value={logDesc}
                  onChange={e => setLogDesc(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedTaskId || !logHours || isSavingLog}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50"
              >
                {isSavingLog ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                <span>Log Time</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

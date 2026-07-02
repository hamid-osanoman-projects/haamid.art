'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Calendar, Clock, AlignLeft } from 'lucide-react'

interface TimeLog {
  id: string
  hours: number
  description: string
  date: string
  created_at: string
}

interface TimeLogPanelProps {
  workId: string
  estimatedHours: number
}

export default function TimeLogPanel({ workId, estimatedHours }: TimeLogPanelProps) {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [hoursInput, setHoursInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isLogging, setIsLogging] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [workId])

  async function fetchLogs() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/works/${workId}/time`)
      if (res.ok) {
        const { logs: data } = await res.json()
        setLogs(data)
      }
    } catch (err) {
      console.error('Failed to fetch time logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogTime(e: React.FormEvent) {
    e.preventDefault()
    const parsedHours = parseFloat(hoursInput)
    if (isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 24 || isLogging) return

    setIsLogging(true)
    try {
      const res = await fetch(`/api/works/${workId}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: parsedHours,
          description: descInput.trim(),
          date: dateInput
        })
      })

      if (res.ok) {
        setHoursInput('')
        setDescInput('')
        setDateInput(new Date().toISOString().split('T')[0])
        fetchLogs()
      }
    } catch (err) {
      console.error('Failed to log time:', err)
    } finally {
      setIsLogging(false)
    }
  }

  async function handleDeleteLog(tid: string) {
    // Optimistic update
    const updated = logs.filter(log => log.id !== tid)
    setLogs(updated)

    try {
      await fetch(`/api/works/${workId}/time/${tid}`, {
        method: 'DELETE'
      })
    } catch (err) {
      console.error('Failed to delete time log:', err)
      fetchLogs()
    }
  }

  const totalLogged = logs.reduce((sum, log) => sum + Number(log.hours || 0), 0)
  const estimatePercentage = estimatedHours > 0 ? Math.round((totalLogged / estimatedHours) * 100) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-xs">Loading time logs...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Quick log time form */}
      <form onSubmit={handleLogTime} className="bg-zinc-500/5 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 p-4 rounded-2xl space-y-3">
        <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Log Time Worked</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-600 block mb-1">Hours</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 1.5"
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                disabled={isLogging}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 py-2 pr-3 pl-8 text-xs text-zinc-800 dark:text-zinc-150 outline-none rounded-xl focus:border-purple-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-600 block mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="date"
                required
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                disabled={isLogging}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 py-1.5 pr-3 pl-8 text-xs text-zinc-800 dark:text-zinc-150 outline-none rounded-xl focus:border-purple-500/50"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-600 block mb-1">Work Description</label>
          <div className="relative">
            <AlignLeft className="absolute left-3 top-3 h-3.5 w-3.5 text-zinc-500" />
            <textarea
              placeholder="What did you work on? (optional)"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              disabled={isLogging}
              rows={2}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 py-2 pr-3 pl-8 text-xs text-zinc-800 dark:text-zinc-150 outline-none rounded-xl focus:border-purple-500/50 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLogging || !hoursInput}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40 text-xs flex items-center justify-center gap-1.5"
        >
          {isLogging ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Log Time Entry</span>
            </>
          )}
        </button>
      </form>

      {/* Time logs history list */}
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Logged History</h4>
        
        <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
          {logs.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No time logs recorded for this task yet.</p>
          ) : (
            logs.map((log) => {
              const formattedDate = new Date(log.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
              return (
                <div
                  key={log.id}
                  className="p-3 border border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/20 rounded-xl flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{log.hours}h</span>
                      <span className="text-[10px] text-zinc-400 font-medium">{formattedDate}</span>
                    </div>
                    {log.description && (
                      <p className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-relaxed">
                        {log.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteLog(log.id)}
                    className="p-1 hover:bg-rose-500/10 text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Summary Total comparison */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-900 flex justify-between items-center px-1">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Progress Estimate</span>
          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
            {totalLogged.toFixed(1)}h logged <span className="text-zinc-400">/ {estimatedHours.toFixed(1)}h estimated</span>
          </div>
        </div>
        
        {estimatedHours > 0 && (
          <div className="flex items-center gap-2">
            <div className="text-xs font-mono font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
              {estimatePercentage}%
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

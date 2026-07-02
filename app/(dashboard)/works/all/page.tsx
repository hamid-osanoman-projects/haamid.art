'use client'

import React, { useState, useEffect } from 'react'
import {
  Search, ArrowUpDown, Trash2, Edit2, Download, CheckSquare, Square, CheckSquare2,
  Calendar, Clock, AlertCircle, Play, CheckCircle2, ChevronRight, X, Loader2
} from 'lucide-react'
import TaskDrawer from '@/components/dashboard/works/TaskDrawer'
import { statuses } from '@/components/dashboard/works/StatusSelector'
import { priorities } from '@/components/dashboard/works/PrioritySelector'

interface WorkItem {
  id: string
  title: string
  track: 'company' | 'freelance' | 'personal'
  status: string
  priority: string
  due_date: string | null
  logged_hours: number
  updated_at: string
  clients: { name: string; company: string } | null
  tags: string[]
  estimated_hours: number | null
  description: string
  created_at: string
}

type RangeOption = 'all' | 'overdue' | 'today' | 'week' | 'month'

export default function AllWorksPage() {
  const [works, setWorks] = useState<WorkItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [trackFilter, setTrackFilter] = useState<'all' | 'company' | 'freelance' | 'personal'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<RangeOption>('all')

  // Sort State
  const [sortField, setSortField] = useState<keyof WorkItem>('due_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  useEffect(() => {
    fetchWorks()
  }, [])

  async function fetchWorks() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/works')
      if (res.ok) {
        const { works: fetchedWorks } = await res.json()
        setWorks(fetchedWorks || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter Logic
  const filteredWorks = works.filter(item => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(query)
      const descMatch = item.description?.toLowerCase().includes(query)
      const tagMatch = item.tags?.some(t => t.toLowerCase().includes(query))
      const clientMatch = item.clients?.name.toLowerCase().includes(query) || item.clients?.company.toLowerCase().includes(query)
      if (!titleMatch && !descMatch && !tagMatch && !clientMatch) return false
    }

    // 2. Track Filter
    if (trackFilter !== 'all' && item.track !== trackFilter) return false

    // 3. Status Filter
    if (statusFilter !== 'all' && item.status !== statusFilter) return false

    // 4. Priority Filter
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false

    // 5. Date Filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      if (!item.due_date) return false
      const due = new Date(item.due_date)

      if (dateFilter === 'overdue') {
        if (due >= startOfToday || item.status === 'done') return false
      } else if (dateFilter === 'today') {
        if (due < startOfToday || due > endOfToday) return false
      } else if (dateFilter === 'week') {
        const endOfWeek = new Date(startOfToday)
        endOfWeek.setDate(endOfWeek.getDate() + 7)
        if (due < startOfToday || due > endOfWeek) return false
      } else if (dateFilter === 'month') {
        const endOfMonth = new Date(startOfToday)
        endOfMonth.setMonth(endOfMonth.getMonth() + 1)
        if (due < startOfToday || due > endOfMonth) return false
      }
    }

    return true
  })

  // Sort Logic
  const sortedWorks = [...filteredWorks].sort((a, b) => {
    let va = a[sortField]
    let vb = b[sortField]

    if (va === null || va === undefined) return sortDir === 'asc' ? 1 : -1
    if (vb === null || vb === undefined) return sortDir === 'asc' ? -1 : 1

    if (typeof va === 'string' && typeof vb === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    }

    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })

  function handleSort(field: keyof WorkItem) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // Bulk selectors
  function handleSelectAll() {
    if (selectedIds.length === filteredWorks.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredWorks.map(w => w.id))
    }
  }

  function handleSelectRow(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  async function handleBulkStatus(status: string) {
    if (selectedIds.length === 0 || isBulkUpdating) return
    setIsBulkUpdating(true)
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/works/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          })
        )
      )
      setSelectedIds([])
      fetchWorks()
    } catch (err) {
      console.error(err)
    } finally {
      setIsBulkUpdating(false)
    }
  }

  async function handleBulkPriority(priority: string) {
    if (selectedIds.length === 0 || isBulkUpdating) return
    setIsBulkUpdating(true)
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/works/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority })
          })
        )
      )
      setSelectedIds([])
      fetchWorks()
    } catch (err) {
      console.error(err)
    } finally {
      setIsBulkUpdating(false)
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0 || isBulkUpdating) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return
    setIsBulkUpdating(true)
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/works/${id}`, { method: 'DELETE' })
        )
      )
      setSelectedIds([])
      fetchWorks()
    } catch (err) {
      console.error(err)
    } finally {
      setIsBulkUpdating(false)
    }
  }

  // CSV Exporter
  function handleExportCSV() {
    const headers = 'Track,Status,Priority,Title,Client/Context,Due Date,Hours Logged,Updated At\n'
    const csvRows = sortedWorks.map(w => {
      const clientStr = w.clients ? `${w.clients.name} (${w.clients.company})` : '—'
      const title = w.title.replace(/"/g, '""')
      const formattedDate = w.due_date || '—'
      return `"${w.track}","${w.status}","${w.priority}","${title}","${clientStr}","${formattedDate}","${w.logged_hours}","${w.updated_at}"`
    }).join('\n')

    const blob = new Blob([headers + csvRows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `all_works_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
            All Works Catalog
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Global view across company duties, freelance projects, and personal workflows.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/5 transition-all cursor-pointer shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-center">
        {/* Search */}
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search all works..."
            className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Track Selector */}
        <div>
          <select
            value={trackFilter}
            onChange={e => setTrackFilter(e.target.value as any)}
            className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
          >
            <option value="all">Track: All</option>
            <option value="company">Company</option>
            <option value="freelance">Freelance</option>
            <option value="personal">Personal</option>
          </select>
        </div>

        {/* Status Selector */}
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
          >
            <option value="all">Status: All</option>
            {statuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Priority Selector */}
        <div>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
          >
            <option value="all">Priority: All</option>
            {priorities.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
          >
            <option value="all">Date: All Time</option>
            <option value="overdue">Overdue Only</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="month">Due This Month</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
          <span className="text-xs font-bold text-purple-650 dark:text-purple-400">
            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Status */}
            <select
              onChange={e => handleBulkStatus(e.target.value)}
              defaultValue=""
              className="text-[10px] bg-white dark:bg-zinc-950 border border-purple-500/20 px-2.5 py-1.5 rounded-lg font-bold text-purple-650 dark:text-purple-400 cursor-pointer outline-none"
            >
              <option value="" disabled>Change Status...</option>
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Bulk Priority */}
            <select
              onChange={e => handleBulkPriority(e.target.value)}
              defaultValue=""
              className="text-[10px] bg-white dark:bg-zinc-950 border border-purple-500/20 px-2.5 py-1.5 rounded-lg font-bold text-purple-650 dark:text-purple-400 cursor-pointer outline-none"
            >
              <option value="" disabled>Change Priority...</option>
              {priorities.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            {/* Bulk Delete */}
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 text-[10px] bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1.5 rounded-lg font-bold cursor-pointer hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Works Grid Catalog */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
          <span className="text-xs font-semibold">Loading works table...</span>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-550 font-bold select-none">
                  <th className="p-3.5 w-10">
                    <button
                      onClick={handleSelectAll}
                      className="text-zinc-400 hover:text-zinc-650 cursor-pointer"
                    >
                      {selectedIds.length === filteredWorks.length && filteredWorks.length > 0 ? (
                        <CheckSquare2 className="h-4 w-4 text-purple-650" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">
                    <button onClick={() => handleSort('track')} className="flex items-center gap-1 cursor-pointer">
                      <span>Track</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3.5">
                    <button onClick={() => handleSort('status')} className="flex items-center gap-1 cursor-pointer">
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3.5">
                    <button onClick={() => handleSort('priority')} className="flex items-center gap-1 cursor-pointer">
                      <span>Priority</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3.5 w-[35%]">
                    <button onClick={() => handleSort('title')} className="flex items-center gap-1 cursor-pointer">
                      <span>Title</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3.5">Client / Context</th>
                  <th className="p-3.5">
                    <button onClick={() => handleSort('due_date')} className="flex items-center gap-1 cursor-pointer">
                      <span>Due Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3.5 text-center">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {sortedWorks.map(w => {
                  const statusMeta = statuses.find(s => s.value === w.status)
                  const priorityMeta = priorities.find(p => p.value === w.priority)
                  const isChecked = selectedIds.includes(w.id)

                  return (
                    <tr
                      key={w.id}
                      onClick={() => setSelectedTaskId(w.id)}
                      className={`hover:bg-zinc-500/5 cursor-pointer transition-colors ${
                        isChecked ? 'bg-purple-500/5' : ''
                      }`}
                    >
                      <td className="p-3.5" onClick={(e) => handleSelectRow(w.id, e)}>
                        <button className="text-zinc-400 hover:text-zinc-650 cursor-pointer">
                          {isChecked ? (
                            <CheckSquare2 className="h-4 w-4 text-purple-650" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-black uppercase text-zinc-400">
                          {w.track}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: (statusMeta?.color || '#737373') + '15',
                            color: statusMeta?.color || '#737373'
                          }}
                        >
                          {statusMeta?.label || w.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold">
                          <span>{priorityMeta?.icon}</span>
                          <span className="capitalize">{w.priority}</span>
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                        {w.title}
                      </td>
                      <td className="p-3.5 text-zinc-500">
                        {w.clients ? `${w.clients.name} (${w.clients.company})` : '—'}
                      </td>
                      <td className="p-3.5 text-zinc-500">
                        {w.due_date
                          ? new Date(w.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'No deadline'}
                      </td>
                      <td className="p-3.5 text-center font-bold text-purple-650 dark:text-purple-400">
                        {w.logged_hours > 0 ? `${w.logged_hours}h` : '—'}
                      </td>
                    </tr>
                  )
                })}

                {sortedWorks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-zinc-450">
                      No works catalog entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Drawer */}
      <TaskDrawer
        workId={selectedTaskId}
        initialTab="details"
        onClose={() => setSelectedTaskId(null)}
        onUpdate={fetchWorks}
      />
    </div>
  )
}

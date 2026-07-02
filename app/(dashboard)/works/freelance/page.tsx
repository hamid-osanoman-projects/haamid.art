'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Loader2, ArrowUpDown, Calendar, Clock, DollarSign,
  LayoutGrid, Columns3, Table2, AlertTriangle, ChevronRight, X
} from 'lucide-react'

interface FreelanceProject {
  id: string
  title: string
  track: string
  status: string
  priority: string
  description: string
  due_date: string | null
  estimated_hours: number | null
  logged_hours: number
  client_id: string | null
  clients: { name: string; company: string; email?: string } | null
  tags: string[]
  icon: string
  color: string
  progress: number
  computed_progress: number
  created_at: string
}

const PIPELINE_STATUSES = [
  { value: 'backlog', label: 'Lead', color: '#737373', icon: '🎯' },
  { value: 'this_week', label: 'Proposal', color: '#3B82F6', icon: '📝' },
  { value: 'in_progress', label: 'Active', color: '#7F77DD', icon: '⚡' },
  { value: 'done', label: 'Complete', color: '#22C55E', icon: '✅' },
  { value: 'on_hold', label: 'On Hold', color: '#A855F7', icon: '⏸' },
]

const FILTERS = ['all', 'backlog', 'in_progress', 'done', 'on_hold'] as const

type ViewMode = 'pipeline' | 'cards' | 'table'

export default function FreelanceWorksPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<FreelanceProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Sort for table
  const [sortField, setSortField] = useState<string>('due_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // New project modal
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string; company: string }[]>([])
  const [form, setForm] = useState({
    title: '', client_id: '', budget: '', currency: 'OMR',
    due_date: '', status: 'backlog', description: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProjects()
    fetchClients()
  }, [])

  async function fetchProjects() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/works?track=freelance')
      if (res.ok) {
        const { works } = await res.json()
        setProjects(works)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchClients() {
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || data || [])
      }
    } catch {
      // Clients API may not exist yet
    }
  }

  // Filter projects
  const filtered = activeFilter === 'all'
    ? projects
    : projects.filter(p => p.status === activeFilter)

  // Sort for table mode
  const sorted = [...filtered].sort((a, b) => {
    const va = (a as any)[sortField]
    const vb = (b as any)[sortField]
    if (va === null || va === undefined) return sortDir === 'asc' ? 1 : -1
    if (vb === null || vb === undefined) return sortDir === 'asc' ? -1 : 1
    if (typeof va === 'string' && typeof vb === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    }
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || isSaving) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          track: 'freelance',
          status: form.status,
          description: form.description,
          due_date: form.due_date || null,
          client_id: form.client_id || null,
          estimated_hours: form.budget ? parseFloat(form.budget) : null,
          tags: form.currency ? [form.currency] : [],
          icon: '💼',
          color: '#7F77DD'
        })
      })
      if (res.ok) {
        setForm({ title: '', client_id: '', budget: '', currency: 'OMR', due_date: '', status: 'backlog', description: '' })
        setIsAddOpen(false)
        fetchProjects()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  function getClientInitials(project: FreelanceProject): string {
    if (project.clients?.name) {
      return project.clients.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    }
    return project.title.slice(0, 2).toUpperCase()
  }

  function getDaysLeft(dueDate: string | null): { text: string; color: string } | null {
    if (!dueDate) return null
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: '#EF4444' }
    if (days <= 3) return { text: `${days}d left`, color: '#EF4444' }
    if (days <= 7) return { text: `${days}d left`, color: '#F59E0B' }
    return { text: `${days}d left`, color: '#22C55E' }
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
            Freelance Projects
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track client projects, milestones, invoices, and deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggles */}
          <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'pipeline'
                  ? 'bg-white dark:bg-zinc-950 shadow-sm text-purple-600 dark:text-purple-400'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
              title="Pipeline"
            >
              <Columns3 className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-zinc-950 shadow-sm text-purple-600 dark:text-purple-400'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
              title="Cards"
            >
              <LayoutGrid className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-950 shadow-sm text-purple-600 dark:text-purple-400'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
              title="Table"
            >
              <Table2 className="h-4.5 w-4.5" />
            </button>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/10 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'backlog', label: 'Lead' },
          { key: 'in_progress', label: 'Active' },
          { key: 'done', label: 'Complete' },
          { key: 'on_hold', label: 'On Hold' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeFilter === f.key
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
          <span className="text-xs font-semibold">Loading projects...</span>
        </div>
      ) : (
        <>
          {/* Pipeline View */}
          {viewMode === 'pipeline' && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {PIPELINE_STATUSES.map(status => {
                const columnProjects = filtered.filter(p => p.status === status.value)
                const columnRevenue = columnProjects.reduce((s, p) => s + (p.estimated_hours || 0), 0)

                return (
                  <div
                    key={status.value}
                    className="flex-shrink-0 w-64 flex flex-col"
                  >
                    {/* Column header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{status.icon}</span>
                        <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{status.label}</h3>
                        <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded font-bold">
                          {columnProjects.length}
                        </span>
                      </div>
                    </div>

                    {/* Column cards */}
                    <div className="space-y-2 flex-1">
                      {columnProjects.map(project => {
                        const deadline = getDaysLeft(project.due_date)
                        return (
                          <div
                            key={project.id}
                            onClick={() => router.push(`/works/freelance/${project.id}`)}
                            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-3.5 cursor-pointer hover:border-purple-500/30 hover:shadow-md hover:shadow-purple-500/5 transition-all group"
                            style={{ borderLeftWidth: 3, borderLeftColor: status.color }}
                          >
                            {/* Client */}
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-black text-white"
                                style={{ backgroundColor: project.color || '#7F77DD' }}
                              >
                                {getClientInitials(project)}
                              </div>
                              <span className="text-[10px] font-bold text-zinc-500 truncate">
                                {project.clients?.name || project.clients?.company || 'No client'}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 mb-2">
                              {project.title}
                            </h4>

                            {/* Progress */}
                            <div className="flex items-center gap-2 mb-2.5">
                              <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all"
                                  style={{ width: `${project.computed_progress || project.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-zinc-400">
                                {project.computed_progress || project.progress || 0}%
                              </span>
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 text-[10px] text-zinc-450 font-bold">
                              {project.estimated_hours && (
                                <span className="flex items-center gap-0.5">
                                  <DollarSign className="h-3 w-3" />
                                  {project.estimated_hours.toLocaleString()} {project.tags?.[0] || 'OMR'}
                                </span>
                              )}
                              {deadline && (
                                <span className="flex items-center gap-0.5" style={{ color: deadline.color }}>
                                  <Calendar className="h-3 w-3" />
                                  {deadline.text}
                                </span>
                              )}
                              {project.logged_hours > 0 && (
                                <span className="flex items-center gap-0.5 text-purple-600 dark:text-purple-400">
                                  <Clock className="h-3 w-3" />
                                  {project.logged_hours}h
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Column footer - revenue */}
                    <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-900 text-[10px] font-bold text-zinc-400 text-center">
                      {columnProjects.length} project{columnProjects.length !== 1 ? 's' : ''}
                      {columnRevenue > 0 && ` · ${columnRevenue.toLocaleString()} OMR`}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(project => {
                const deadline = getDaysLeft(project.due_date)
                const statusMeta = PIPELINE_STATUSES.find(s => s.value === project.status)
                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/works/freelance/${project.id}`)}
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 cursor-pointer hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/5 transition-all group"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm"
                          style={{ backgroundColor: project.color || '#7F77DD' }}
                        >
                          {getClientInitials(project)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
                            {project.title}
                          </h4>
                          <p className="text-[10px] text-zinc-450 font-semibold">
                            {project.clients?.name || 'No client linked'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`}
                        style={{
                          backgroundColor: (statusMeta?.color || '#737373') + '15',
                          color: statusMeta?.color || '#737373'
                        }}
                      >
                        {statusMeta?.label}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                          style={{ width: `${project.computed_progress || project.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-zinc-500">
                        {project.computed_progress || project.progress || 0}%
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-[11px] text-zinc-450 font-semibold">
                      {project.estimated_hours && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {project.estimated_hours.toLocaleString()} OMR
                        </span>
                      )}
                      {deadline && (
                        <span className="flex items-center gap-1" style={{ color: deadline.color }}>
                          <Calendar className="h-3.5 w-3.5" />
                          {deadline.text}
                        </span>
                      )}
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4 text-zinc-300" />
                    </div>
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center text-xs text-zinc-450 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                  No projects match this filter.
                </div>
              )}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-550 font-bold">
                      <th className="p-3.5">
                        <button onClick={() => toggleSort('status')} className="flex items-center gap-1 cursor-pointer">
                          Status <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="p-3.5 w-[30%]">
                        <button onClick={() => toggleSort('title')} className="flex items-center gap-1 cursor-pointer">
                          Project <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="p-3.5">Client</th>
                      <th className="p-3.5 text-right">
                        <button onClick={() => toggleSort('estimated_hours')} className="flex items-center gap-1 cursor-pointer ml-auto">
                          Budget <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="p-3.5">
                        <button onClick={() => toggleSort('due_date')} className="flex items-center gap-1 cursor-pointer">
                          Deadline <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="p-3.5 text-center">Progress</th>
                      <th className="p-3.5 text-center">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {sorted.map(project => {
                      const statusMeta = PIPELINE_STATUSES.find(s => s.value === project.status)
                      return (
                        <tr
                          key={project.id}
                          onClick={() => router.push(`/works/freelance/${project.id}`)}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 cursor-pointer transition-colors"
                        >
                          <td className="p-3.5">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: (statusMeta?.color || '#737373') + '15',
                                color: statusMeta?.color || '#737373'
                              }}
                            >
                              {statusMeta?.label}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                            {project.title}
                          </td>
                          <td className="p-3.5 text-zinc-500">
                            {project.clients?.name || '—'}
                          </td>
                          <td className="p-3.5 text-right font-semibold text-zinc-700 dark:text-zinc-300">
                            {project.estimated_hours ? `${project.estimated_hours.toLocaleString()} OMR` : '—'}
                          </td>
                          <td className="p-3.5 text-zinc-500">
                            {project.due_date
                              ? new Date(project.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${project.computed_progress || project.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-zinc-400">
                                {project.computed_progress || project.progress || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-center font-bold text-purple-600 dark:text-purple-400">
                            {project.logged_hours > 0 ? `${project.logged_hours}h` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                    {sorted.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-zinc-450">
                          No projects found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* New Project Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setIsAddOpen(false)}>
          <div
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">New Freelance Project</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Project Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full mt-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  placeholder="e.g. SaaS Dashboard Redesign"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Client</label>
                  <select
                    value={form.client_id}
                    onChange={e => setForm({ ...form, client_id: e.target.value })}
                    className="w-full mt-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                  >
                    <option value="">No client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Initial Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full mt-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                  >
                    {PIPELINE_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Budget</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })}
                    className="w-full mt-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full mt-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                  >
                    <option value="OMR">OMR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="AED">AED</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Deadline</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full mt-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full mt-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none resize-none focus:border-purple-500"
                  placeholder="Scope of work, deliverables..."
                />
              </div>

              <button
                type="submit"
                disabled={!form.title.trim() || isSaving}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>Create Project</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

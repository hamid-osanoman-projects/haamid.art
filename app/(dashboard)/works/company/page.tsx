'use client'

import React, { useState, useEffect } from 'react'
import { KanbanSquare, List, Table2, Plus, Calendar, Clock, ArrowUpDown, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
const KanbanBoard = dynamic(() => import('@/components/dashboard/works/KanbanBoard'), { ssr: false })
import WorkFilters, { FilterState } from '@/components/dashboard/works/WorkFilters'
import WorkSearch from '@/components/dashboard/works/WorkSearch'
import AddTaskModal from '@/components/dashboard/works/TaskForm'
import TaskDrawer from '@/components/dashboard/works/TaskDrawer'
import { priorities } from '@/components/dashboard/works/PrioritySelector'
import { statuses } from '@/components/dashboard/works/StatusSelector'

interface Task {
  id: string
  title: string
  track: 'company' | 'freelance' | 'personal'
  status: string
  priority: string
  description: string
  due_date: string | null
  estimated_hours: number | null
  logged_hours: number
  client_id: string | null
  tags: string[]
  icon: string
  color: string
  blocked_reason: string
  is_recurring: boolean
  recur_interval: string
  progress: number
}

type ViewMode = 'kanban' | 'list' | 'table'

export default function CompanyWorksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    today: false,
    thisWeek: false,
    overdue: false,
    blocked: false,
    highPriority: false
  })

  // Modals & Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [drawerTab, setDrawerTab] = useState<'details' | 'subtasks' | 'time' | 'updates' | 'attachments'>('details')

  // Sorting for Table Mode
  const [sortField, setSortField] = useState<keyof Task>('due_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/works?track=company')
      if (res.ok) {
        const { works } = await res.json()
        setTasks(works)
      }
    } catch (err) {
      console.error('Failed to load company tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle local state updates from drag end immediately before background API resolves
  function handleOptimisticStatusChange(taskId: string, newStatus: string) {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    )
  }

  // Apply Search and Additive Filters in-memory
  const filteredTasks = tasks.filter(task => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const titleMatch = task.title.toLowerCase().includes(query)
      const descMatch = task.description?.toLowerCase().includes(query)
      const tagMatch = task.tags?.some(t => t.toLowerCase().includes(query))
      if (!titleMatch && !descMatch && !tagMatch) return false
    }

    // 2. Additive Filters
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // Today
    if (filters.today) {
      if (!task.due_date) return false
      const due = new Date(task.due_date)
      if (due < startOfToday || due > endOfToday) return false
    }

    // This Week
    if (filters.thisWeek) {
      if (!task.due_date) return false
      const due = new Date(task.due_date)
      const oneWeekFromNow = new Date()
      oneWeekFromNow.setDate(now.getDate() + 7)
      if (due < startOfToday || due > oneWeekFromNow) return false
    }

    // Overdue
    if (filters.overdue) {
      if (!task.due_date) return false
      const due = new Date(task.due_date)
      if (due >= startOfToday || task.status === 'done') return false
    }

    // Blocked
    if (filters.blocked) {
      if (task.status !== 'blocked') return false
    }

    // High priority (high or urgent)
    if (filters.highPriority) {
      if (task.priority !== 'high' && task.priority !== 'urgent') return false
    }

    return true
  })

  // Apply sorting for Table Mode
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let valA = a[sortField]
    let valB = b[sortField]

    if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1
    if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA)
    }

    // Numbers or boolean sort
    return sortDirection === 'asc'
      ? (valA > valB ? 1 : -1)
      : (valA < valB ? 1 : -1)
  })

  function toggleSort(field: keyof Task) {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  function handleCardClick(taskId: string, tab: 'details' | 'subtasks' | 'time' | 'updates' | 'attachments' = 'details') {
    setDrawerTab(tab)
    setSelectedTaskId(taskId)
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
            Company Task Board
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage your daily milestones, log hours, and coordinate employee workflows.
          </p>
        </div>

        {/* View togglers & Actions */}
        <div className="flex items-center gap-3">
          {/* Layout view controls */}
          <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-zinc-950 shadow-sm text-purple-600 dark:text-purple-400'
                  : 'text-zinc-400 hover:text-zinc-650'
              }`}
              title="Kanban Board"
            >
              <KanbanSquare className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-950 shadow-sm text-purple-600 dark:text-purple-400'
                  : 'text-zinc-400 hover:text-zinc-650'
              }`}
              title="List View"
            >
              <List className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-950 shadow-sm text-purple-600 dark:text-purple-400'
                  : 'text-zinc-400 hover:text-zinc-650'
              }`}
              title="Table Grid"
            >
              <Table2 className="h-4.5 w-4.5" />
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-550/10 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <WorkFilters filters={filters} onChange={setFilters} />
        <WorkSearch value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Main Boards / Views */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
          <span className="text-xs font-semibold">Loading company tasks...</span>
        </div>
      ) : (
        <>
          {viewMode === 'kanban' && (
            <KanbanBoard
              tasks={filteredTasks}
              onCardClick={handleCardClick}
              onUpdate={fetchTasks}
              onOptimisticStatusChange={handleOptimisticStatusChange}
            />
          )}

          {viewMode === 'list' && (
            <div className="space-y-6">
              {statuses.map((statusMeta) => {
                const columnTasks = filteredTasks.filter(t => t.status === statusMeta.value)
                if (columnTasks.length === 0) return null

                return (
                  <div key={statusMeta.value} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <span style={{ color: statusMeta.color }} className="text-sm font-semibold">
                        {statusMeta.icon}
                      </span>
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {statusMeta.label}
                      </h3>
                      <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.2 rounded font-bold">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {columnTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleCardClick(task.id, 'details')}
                          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-purple-500/20 p-4 rounded-2xl flex items-center justify-between cursor-pointer group"
                        >
                          <div className="space-y-1 truncate pr-3">
                            <span className="text-[9px] uppercase font-bold text-zinc-450 tracking-wider">
                              {priorities.find(p => p.value === task.priority)?.icon} {task.priority}
                            </span>
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                              {task.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0 text-[10px] text-zinc-400 font-bold">
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                            {task.logged_hours > 0 && (
                              <div className="flex items-center gap-1 text-purple-600">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{task.logged_hours}h</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {filteredTasks.length === 0 && (
                <div className="py-20 text-center text-xs text-zinc-450 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-3xl">
                  No company tasks match the filters.
                </div>
              )}
            </div>
          )}

          {viewMode === 'table' && (
            <div className="border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-550 font-bold">
                      <th className="p-3.5">
                        <button onClick={() => toggleSort('status')} className="flex items-center gap-1 cursor-pointer">
                          <span>Status</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="p-3.5">
                        <button onClick={() => toggleSort('priority')} className="flex items-center gap-1 cursor-pointer">
                          <span>Priority</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="p-3.5 w-[40%]">
                        <button onClick={() => toggleSort('title')} className="flex items-center gap-1 cursor-pointer">
                          <span>Task Title</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="p-3.5">
                        <button onClick={() => toggleSort('due_date')} className="flex items-center gap-1 cursor-pointer">
                          <span>Due Date</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="p-3.5 text-center">Est.</th>
                      <th className="p-3.5 text-center">Logged</th>
                      <th className="p-3.5">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-250/30 dark:divide-zinc-900">
                    {sortedTasks.map(task => {
                      const statusMeta = statuses.find(s => s.value === task.status)
                      const priorityMeta = priorities.find(p => p.value === task.priority)
                      return (
                        <tr
                          key={task.id}
                          onClick={() => handleCardClick(task.id, 'details')}
                          className="hover:bg-zinc-500/5 dark:hover:bg-zinc-900/20 cursor-pointer transition-colors"
                        >
                          <td className="p-3.5">
                            <span
                              style={{ borderLeftColor: statusMeta?.color }}
                              className="pl-2 border-l-2 text-[10px] font-bold text-zinc-700 dark:text-zinc-300"
                            >
                              {statusMeta?.label}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="flex items-center gap-1 text-[10px] font-bold">
                              <span>{priorityMeta?.icon}</span>
                              <span className="capitalize">{task.priority}</span>
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                            {task.title}
                          </td>
                          <td className="p-3.5 text-zinc-500">
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'No deadline'}
                          </td>
                          <td className="p-3.5 text-center font-semibold text-zinc-750 dark:text-zinc-400">
                            {task.estimated_hours ? `${task.estimated_hours}h` : '-'}
                          </td>
                          <td className="p-3.5 text-center font-bold text-purple-650 dark:text-purple-400">
                            {task.logged_hours > 0 ? `${task.logged_hours}h` : '-'}
                          </td>
                          <td className="p-3.5">
                            <div className="flex gap-1 flex-wrap">
                              {task.tags.map(t => (
                                <span
                                  key={t}
                                  className="bg-purple-500/5 border border-purple-500/10 px-1 py-0.2 rounded text-[9px] text-purple-650 dark:text-purple-400"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {sortedTasks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-zinc-450">
                          No tasks recorded for this filter match.
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

      {/* Quick Add Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTasks}
        defaultTrack="company"
      />

      {/* Task Drawer Overlay */}
      <TaskDrawer
        workId={selectedTaskId}
        initialTab={drawerTab}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={fetchTasks}
      />
    </div>
  )
}

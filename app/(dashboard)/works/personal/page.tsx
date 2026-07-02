'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus, Loader2, ArrowRight, Calendar, Clock, Sparkles, Trash2, CheckCircle2, Circle, X
} from 'lucide-react'
import TaskDrawer from '@/components/dashboard/works/TaskDrawer'

interface PersonalProject {
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
  tags: string[]
  icon: string
  color: string
  progress: number
  computed_progress: number
  created_at: string
}

const CATEGORIES = ['Learning', 'Building', 'Research', 'Reading', 'Other'] as const
const EMOJIS = ['🎨', '💻', '📚', '🚀', '🧠', '✍️', '🎮', '🎵', '🛠️', '📈', '🔬', '🌍', '🏠', '🔥', '💡', '🌱', '⚙️', '🧩', '📸', '📦']

export default function PersonalWorksPage() {
  const [projects, setProjects] = useState<PersonalProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Add project modal state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [form, setForm] = useState({
    title: '', icon: '🎨', category: 'Learning' as typeof CATEGORIES[number],
    description: '', due_date: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/works?track=personal')
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || isSaving) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          track: 'personal',
          status: 'in_progress', // Default to active/in-progress for active section
          icon: form.icon,
          tags: [form.category],
          description: form.description,
          due_date: form.due_date || null
        })
      })

      if (res.ok) {
        setForm({ title: '', icon: '🎨', category: 'Learning', description: '', due_date: '' })
        setIsAddOpen(false)
        fetchProjects()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleBacklog(project: PersonalProject) {
    const newStatus = project.status === 'done' ? 'backlog' : 'done'
    // Optimistic update
    setProjects(prev =>
      prev.map(p => p.id === project.id ? { ...p, status: newStatus } : p)
    )

    await fetch(`/api/works/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    fetchProjects()
  }

  async function handleDelete(projectId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project?')) return

    setProjects(prev => prev.filter(p => p.id !== projectId))
    await fetch(`/api/works/${projectId}`, { method: 'DELETE' })
    fetchProjects()
  }

  // Group active vs backlog
  // Active = status in ('in_progress', 'this_week', 'blocked', 'in_review')
  const activeProjects = projects.filter(p =>
    ['in_progress', 'this_week', 'blocked', 'in_review'].includes(p.status)
  )

  // Backlog = status in ('backlog', 'done', 'cancelled', 'on_hold')
  const backlogProjects = projects.filter(p =>
    ['backlog', 'done', 'cancelled', 'on_hold'].includes(p.status)
  )

  return (
    <div className="space-y-8 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
            Personal Projects
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track self-learning, experiments, and side projects without client deadlines.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/10 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Project</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
          <span className="text-xs font-semibold">Loading personal projects...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Active Projects */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Active Projects</span>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.2 rounded">
                {activeProjects.length}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => setSelectedTaskId(project.id)}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/5 transition-all cursor-pointer group relative flex flex-col justify-between min-h-[140px]"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-2xl flex-shrink-0">{project.icon || '📋'}</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {project.tags.map(t => (
                          <span
                            key={t}
                            className="bg-purple-500/5 border border-purple-500/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-purple-650 dark:text-purple-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {project.title}
                      </h4>
                      {project.description && (
                        <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                          style={{ width: `${project.computed_progress || project.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400">
                        {project.computed_progress || project.progress || 0}%
                      </span>
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-450 font-bold">
                      <div className="flex items-center gap-3">
                        {project.due_date && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {project.logged_hours > 0 && (
                          <span className="flex items-center gap-0.5 text-purple-600">
                            <Clock className="h-3 w-3" />
                            {project.logged_hours}h
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-450 hover:text-red-500 p-1 rounded transition-opacity cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {activeProjects.length === 0 && (
                <div className="col-span-full py-16 text-center text-xs text-zinc-450 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-3xl">
                  No active personal projects. Click "New Project" to add one!
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Backlog & Completed */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <span>Backlog & Finished Queue</span>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.2 rounded">
                {backlogProjects.length}
              </span>
            </h2>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-900">
              {backlogProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => setSelectedTaskId(project.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-500/5 group"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleBacklog(project)
                      }}
                      className="cursor-pointer text-zinc-400 hover:text-purple-600 transition-colors"
                    >
                      {project.status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-lg">{project.icon}</span>
                      <span className={`text-xs font-bold ${
                        project.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'
                      }`}>
                        {project.title}
                      </span>
                      <span className="text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-450 px-2 py-0.5 rounded font-bold">
                        {project.tags?.[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {project.due_date && (
                      <span className="text-[10px] text-zinc-450 font-bold flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-1 cursor-pointer transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {backlogProjects.length === 0 && (
                <div className="py-12 text-center text-xs text-zinc-450">
                  No projects in your backlog.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setIsAddOpen(false)}>
          <div
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">New Personal Project</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Emoji Icon</label>
                <div className="grid grid-cols-10 gap-2 mt-1.5 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl max-h-24 overflow-y-auto">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm({ ...form, icon: e })}
                      className={`text-xl p-1 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer ${
                        form.icon === e ? 'bg-white dark:bg-zinc-950 shadow-sm border border-purple-500/30' : ''
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Project Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  placeholder="e.g. Learn Three.js Shader Programming"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as any })}
                    className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none resize-none focus:border-purple-500"
                  placeholder="Scope, goal, notes..."
                />
              </div>

              <button
                type="submit"
                disabled={!form.title.trim() || isSaving}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>Create Project</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Drawer */}
      <TaskDrawer
        workId={selectedTaskId}
        initialTab="details"
        onClose={() => setSelectedTaskId(null)}
        onUpdate={fetchProjects}
      />
    </div>
  )
}

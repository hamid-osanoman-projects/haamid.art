'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Calendar, Clock, Tag, MessageSquare, AlertCircle, FileText, ChevronRight, Edit3, Eye, Copy, ArrowRight, Clipboard, Trash2, ListTodo, Layers, Loader2, MoreVertical } from 'lucide-react'
import StatusSelector from './StatusSelector'
import PrioritySelector from './PrioritySelector'
import SubtaskList from './SubtaskList'
import TimeLogPanel from './TimeLogPanel'
import ActivityFeed from './ActivityFeed'
import AttachmentsList from './AttachmentsList'

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

interface TaskDrawerProps {
  workId: string | null
  initialTab?: Tab
  onClose: () => void
  onUpdate: () => void
}

const TABS = ['details', 'subtasks', 'time', 'updates', 'attachments'] as const
type Tab = typeof TABS[number]

export default function TaskDrawer({ workId, initialTab, onClose, onUpdate }: TaskDrawerProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewingDesc, setIsPreviewingDesc] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  
  // Title / Tags inline edit state
  const [editedTitle, setEditedTitle] = useState('')
  const [tagInput, setTagInput] = useState('')

  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    if (workId) {
      fetchTaskDetails()
    } else {
      setTask(null)
    }
  }, [workId])

  // Close more menu when drawer updates or closes
  useEffect(() => {
    setIsMoreOpen(false)
  }, [workId])

  // Handle ESC key close & Tab switching
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!workId) return
      
      // Close on ESC
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Tab switching: shift tabs if user presses tab while focus is NOT on inputs
      if (e.key === 'Tab') {
        const activeEl = document.activeElement
        const isInput = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('contenteditable') === 'true'
        )

        // Only switch tabs if not typing in form fields
        if (!isInput) {
          e.preventDefault()
          const currentIndex = TABS.indexOf(activeTab)
          const nextIndex = (currentIndex + 1) % TABS.length
          setActiveTab(TABS[nextIndex])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [workId, activeTab, onClose])

  async function fetchTaskDetails() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/works/${workId}`)
      if (res.ok) {
        const { work } = await res.json()
        setTask(work)
        setEditedTitle(work.title)
      } else {
        onClose()
      }
    } catch (err) {
      console.error('Failed to load task details:', err)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  async function updateTask(updates: Partial<Task>) {
    if (!task) return
    
    // Optimistic UI updates
    setTask({ ...task, ...updates } as Task)

    try {
      const res = await fetch(`/api/works/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        onUpdate() // Refresh list or kanban behind it
        window.dispatchEvent(new CustomEvent('works-updated'))
      }
    } catch (err) {
      console.error('Failed to update task:', err)
      fetchTaskDetails() // Revert
    }
  }

  async function duplicateTask() {
    if (!task) return
    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${task.title} (Copy)`,
          track: task.track,
          status: 'backlog',
          priority: task.priority,
          description: task.description,
          due_date: task.due_date,
          estimated_hours: task.estimated_hours,
          tags: task.tags,
          icon: task.icon,
          color: task.color
        })
      })

      if (res.ok) {
        alert('Task duplicated successfully!')
        onUpdate()
        window.dispatchEvent(new CustomEvent('works-updated'))
        setIsMoreOpen(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Deep Link sharing copy
  function copyDeepLink() {
    if (!task) return
    const link = `${window.location.origin}/dashboard/works/${task.id}`
    navigator.clipboard.writeText(link)
    alert('Task link copied to clipboard!')
  }

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (task && !task.tags.includes(newTag)) {
        const nextTags = [...task.tags, newTag]
        updateTask({ tags: nextTags })
      }
      setTagInput('')
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    if (!task) return
    const nextTags = task.tags.filter(t => t !== tagToRemove)
    updateTask({ tags: nextTags })
  }

  // Simple Markdown Parser
  function renderMarkdown(text: string) {
    if (!text) return '<p class="text-zinc-500 italic">No description provided.</p>'
    const clean = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>')
      .replace(/\n/g, '<br />')
    return `<div class="space-y-1 text-zinc-700 dark:text-zinc-300 text-xs">${clean}</div>`
  }

  if (!workId) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content wrapper */}
      <div
        ref={drawerRef}
        className="relative w-full md:w-[480px] h-full bg-white dark:bg-zinc-950 shadow-2xl border-l border-zinc-200 dark:border-zinc-900 flex flex-col z-10 animate-slide-in"
      >
        {isLoading && !task ? (
          <div className="flex flex-col items-center justify-center flex-1 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
            <span className="text-xs font-semibold">Loading details...</span>
          </div>
        ) : task ? (
          <>
            {/* Header section */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{task.icon || '📋'}</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500 tracking-wider">
                  {task.track}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* ⋮ More Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {isMoreOpen && (
                    <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl shadow-xl z-25 p-1 text-xs">
                      <button
                        onClick={duplicateTask}
                        className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer font-semibold text-zinc-700 dark:text-zinc-300"
                      >
                        Duplicate Task
                      </button>
                      <button
                        onClick={() => { copyDeepLink(); setIsMoreOpen(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer font-semibold text-zinc-700 dark:text-zinc-300"
                      >
                        Copy Task Link
                      </button>
                      <div className="border-t border-zinc-100 dark:border-zinc-900 my-1" />
                      <div className="px-3 py-1 text-[9px] uppercase font-bold text-zinc-400">Move to Track</div>
                      {(['company', 'freelance', 'personal'] as const).map(tr => (
                        <button
                          key={tr}
                          disabled={task.track === tr}
                          onClick={() => {
                            updateTask({ track: tr });
                            setIsMoreOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer disabled:opacity-40 font-semibold text-zinc-750 dark:text-zinc-300 capitalize"
                        >
                          {tr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="p-2 text-zinc-500 hover:text-rose-500 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Task Progress Bar (dynamic updates) */}
            <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900">
              <div
                style={{ width: `${task.progress || 0}%` }}
                className="h-full bg-purple-500 transition-all duration-300"
              />
            </div>

            {/* Tab navigation headers */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-900 text-xs px-2 bg-zinc-50/50 dark:bg-zinc-900/10">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-center font-bold capitalize transition-colors cursor-pointer border-b-2 ${
                    activeTab === tab
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Body contents based on active tab */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Title editor */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onBlur={() => {
                        if (editedTitle.trim() && editedTitle !== task.title) {
                          updateTask({ title: editedTitle.trim() })
                        }
                      }}
                      className="w-full text-lg font-black bg-transparent border-none outline-none text-zinc-900 dark:text-white focus:border-b focus:border-purple-500/50 pb-1"
                    />
                  </div>

                  {/* Flow selectors (Status and Priority) */}
                  <div className="flex gap-4">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-650 block">Status</label>
                      <StatusSelector
                        value={task.status}
                        onChange={(newValue) => updateTask({ status: newValue })}
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-650 block">Priority</label>
                      <PrioritySelector
                        value={task.priority}
                        onChange={(newValue) => updateTask({ priority: newValue })}
                      />
                    </div>
                  </div>

                  {/* Blocked Reason (only shows if blocked status is selected) */}
                  {task.status === 'blocked' && (
                    <div className="p-3 border border-rose-200 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold">
                        <AlertCircle className="h-4 w-4" />
                        <span>Why is this blocked?</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Provide details on the bottleneck..."
                        value={task.blocked_reason || ''}
                        onChange={(e) => setTask({ ...task, blocked_reason: e.target.value })}
                        onBlur={(e) => updateTask({ blocked_reason: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 rounded-xl outline-none focus:border-rose-500/50"
                      />
                    </div>
                  )}

                  {/* Deadlines and target estimations */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-650 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due Date</span>
                      </label>
                      <input
                        type="date"
                        value={task.due_date ? task.due_date.split('T')[0] : ''}
                        onChange={(e) => updateTask({ due_date: e.target.value || null })}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-250 outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-650 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Est. Hours</span>
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 8"
                        value={task.estimated_hours || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseFloat(e.target.value)
                          updateTask({ estimated_hours: val })
                        }}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-250 outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>

                  {/* Tags list */}
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-650 flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      <span>Tags</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 bg-purple-500/5 text-purple-650 dark:text-purple-400 border border-purple-500/10 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-rose-500 font-bold ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="+ Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="bg-transparent border-none outline-none text-xs py-0.5 text-zinc-600 dark:text-zinc-300 w-24"
                      />
                    </div>
                  </div>

                  {/* Description Markdown editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-650 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>Description</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsPreviewingDesc(!isPreviewingDesc)}
                        className="text-[10px] font-bold text-purple-600 hover:text-purple-500 flex items-center gap-1 cursor-pointer"
                      >
                        {isPreviewingDesc ? (
                          <>
                            <Edit3 className="h-3 w-3" />
                            <span>Edit Description</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>Preview Render</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isPreviewingDesc ? (
                      <div
                        className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl min-h-[120px]"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(task.description) }}
                      />
                    ) : (
                      <textarea
                        placeholder="Provide details about the task, requirements, scope (supports markdown tags)..."
                        value={task.description || ''}
                        onChange={(e) => setTask({ ...task, description: e.target.value })}
                        onBlur={(e) => updateTask({ description: e.target.value })}
                        rows={6}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-500/50 resize-y"
                      />
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'subtasks' && (
                <SubtaskList
                  workId={task.id}
                  onProgressUpdate={(percentage) => updateTask({ progress: percentage })}
                />
              )}

              {activeTab === 'time' && (
                <TimeLogPanel
                  workId={task.id}
                  estimatedHours={task.estimated_hours || 0}
                />
              )}

              {activeTab === 'updates' && (
                <ActivityFeed workId={task.id} />
              )}

              {activeTab === 'attachments' && (
                <AttachmentsList workId={task.id} />
              )}
            </div>

            {/* Footer options */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400">
                Created: {new Date(task.due_date || task.id ? Date.now() : Date.now()).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    const res = await fetch(`/api/works/${task.id}`, { method: 'DELETE' })
                    if (res.ok) {
                      onUpdate()
                      window.dispatchEvent(new CustomEvent('works-updated'))
                      onClose()
                    }
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-bold text-rose-500 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Task</span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

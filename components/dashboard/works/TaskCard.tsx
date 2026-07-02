'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Calendar, Clock, MessageSquare, Edit3, Trash2, Copy, Play } from 'lucide-react'
import { priorities } from './PrioritySelector'
import { statuses } from './StatusSelector'

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
  subtask_count?: number
  subtasks_done?: number
}

interface TaskCardProps {
  task: Task
  onClick: (tab?: 'details' | 'subtasks' | 'time' | 'updates' | 'attachments') => void
  onUpdate: () => void
}

export default function TaskCard({ task, onClick, onUpdate }: TaskCardProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const priorityMeta = priorities.find(p => p.value === task.priority) || priorities[2]
  const statusMeta = statuses.find(s => s.value === task.status) || statuses[0]

  // Close context menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [contextMenu])

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  async function handleStatusChange(newStatus: string) {
    setContextMenu(null)
    try {
      const res = await fetch(`/api/works/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to change status:', err)
    }
  }

  async function handlePriorityChange(newPriority: string) {
    setContextMenu(null)
    try {
      const res = await fetch(`/api/works/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      })
      if (res.ok) {
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to change priority:', err)
    }
  }

  async function handleDuplicate() {
    setContextMenu(null)
    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Copy of ${task.title}`,
          track: task.track,
          status: 'backlog', // lands in backlog
          priority: task.priority,
          description: task.description,
          due_date: task.due_date,
          estimated_hours: task.estimated_hours,
          client_id: task.client_id,
          tags: task.tags,
          icon: task.icon,
          color: task.color
        })
      })
      if (res.ok) {
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to duplicate task:', err)
    }
  }

  async function handleDelete() {
    setContextMenu(null)
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const res = await fetch(`/api/works/${task.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  // Format date nicely
  const formattedDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  // Computed subtask progress if subtasks exist
  const progressPercent = task.subtask_count && task.subtask_count > 0
    ? Math.round(((task.subtasks_done || 0) / task.subtask_count) * 100)
    : task.progress || 0

  return (
    <div
      onContextMenu={handleContextMenu}
      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-purple-500/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group relative cursor-pointer"
      onClick={() => onClick('details')}
    >
      {/* Priority indicator + Tags list */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 px-2 py-0.5 rounded-lg text-[9px] font-bold text-zinc-550 dark:text-zinc-400">
          <span className="text-[9px] leading-none">{priorityMeta.icon}</span>
          <span>{priorityMeta.label}</span>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 overflow-hidden max-w-[60%] justify-end">
            {task.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="bg-purple-500/5 text-purple-650 dark:text-purple-400 border border-purple-500/10 px-1.5 py-0.5 rounded text-[8px] font-bold truncate"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-[8px] text-zinc-400 font-bold px-1 bg-zinc-50 dark:bg-zinc-900 rounded">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Task Title (2 lines max) */}
      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-relaxed mb-3 pr-2">
        {task.title}
      </h4>

      {/* Progress Bar */}
      {(progressPercent > 0 || (task.subtask_count && task.subtask_count > 0)) && (
        <div className="space-y-1 mb-4">
          <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold">
            <span>
              {task.subtask_count ? `${task.subtasks_done}/${task.subtask_count} subtasks` : 'Progress'}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
            />
          </div>
        </div>
      )}

      {/* Footer statistics (due date, hours, activity logs) */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-550 font-bold pt-2.5 border-t border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-3">
          {formattedDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-500' : ''}`}>
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
          )}
          
          {task.logged_hours > 0 && (
            <div className="flex items-center gap-1 text-purple-650 dark:text-purple-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{task.logged_hours}h</span>
            </div>
          )}
        </div>

        {/* Action icons / Hover triggers */}
        <div className="flex items-center gap-2">
          {/* Quick Actions (only visible on hover) */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              type="button"
              title="Quick Log Hours"
              onClick={(e) => {
                e.stopPropagation()
                onClick('time')
              }}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-purple-650 dark:text-purple-400 cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Delete Task"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-lg cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 text-zinc-400">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="text-[9px]">
              {task.subtask_count || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-2xl p-1 w-48 rounded-2xl z-[100] text-xs font-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-550 border-b border-zinc-100 dark:border-zinc-900 mb-1">
            Quick Actions
          </div>
          
          <button
            onClick={() => onClick('details')}
            className="flex items-center w-full px-2.5 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-left text-zinc-700 dark:text-zinc-300"
          >
            <Edit3 className="h-3.5 w-3.5 mr-2 text-zinc-450" />
            Open Details
          </button>
          
          <button
            onClick={handleDuplicate}
            className="flex items-center w-full px-2.5 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-left text-zinc-700 dark:text-zinc-300"
          >
            <Copy className="h-3.5 w-3.5 mr-2 text-zinc-450" />
            Duplicate Task
          </button>

          {/* Submenus */}
          <div className="border-t border-zinc-100 dark:border-zinc-900 my-1" />
          
          <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-550">
            Move to Status
          </div>
          
          <div className="grid grid-cols-2 gap-0.5 p-1">
            {statuses.map(s => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                className={`px-1.5 py-1 text-[10px] text-center rounded transition-colors ${
                  task.status === s.value
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-900 my-1" />
          
          <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-550">
            Set Priority
          </div>
          
          <div className="grid grid-cols-2 gap-0.5 p-1">
            {priorities.map(p => (
              <button
                key={p.value}
                onClick={() => handlePriorityChange(p.value)}
                className={`px-1.5 py-1 text-[10px] text-center rounded transition-colors ${
                  task.priority === p.value
                    ? 'bg-purple-650 text-white font-bold'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-900 my-1" />
          
          <button
            onClick={handleDelete}
            className="flex items-center w-full px-2.5 py-1.5 hover:bg-rose-500/10 rounded-lg text-left text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete Task
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  GripVertical, Plus, Trash2, Calendar, CheckCircle2,
  Circle, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'

interface Milestone {
  id: string
  work_id: string
  title: string
  description: string
  due_date: string | null
  completed: boolean
  completed_at: string | null
  sort_order: number
  created_at: string
}

interface MilestoneListProps {
  workId: string
}

export default function MilestoneList({ workId }: MilestoneListProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch(`/api/works/${workId}/milestones`)
      if (res.ok) {
        const { milestones: data } = await res.json()
        setMilestones(data)
      }
    } catch (err) {
      console.error('Failed to fetch milestones:', err)
    } finally {
      setIsLoading(false)
    }
  }, [workId])

  useEffect(() => {
    fetchMilestones()
  }, [fetchMilestones])

  async function handleAdd() {
    if (!newTitle.trim() || isAdding) return
    setIsAdding(true)
    try {
      const res = await fetch(`/api/works/${workId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      })
      if (res.ok) {
        setNewTitle('')
        fetchMilestones()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleToggleComplete(milestone: Milestone) {
    const newCompleted = !milestone.completed
    // Optimistic update
    setMilestones(prev =>
      prev.map(m =>
        m.id === milestone.id
          ? { ...m, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : m
      )
    )

    await fetch(`/api/works/${workId}/milestones/${milestone.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newCompleted })
    })
  }

  async function handleDelete(milestoneId: string) {
    setMilestones(prev => prev.filter(m => m.id !== milestoneId))
    await fetch(`/api/works/${workId}/milestones/${milestoneId}`, { method: 'DELETE' })
  }

  async function handleUpdateTitle(milestoneId: string) {
    if (!editingTitle.trim()) return
    setMilestones(prev =>
      prev.map(m => m.id === milestoneId ? { ...m, title: editingTitle.trim() } : m)
    )
    setEditingTitleId(null)

    await fetch(`/api/works/${workId}/milestones/${milestoneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editingTitle.trim() })
    })
  }

  async function handleUpdateDueDate(milestoneId: string, dueDate: string) {
    setMilestones(prev =>
      prev.map(m => m.id === milestoneId ? { ...m, due_date: dueDate || null } : m)
    )

    await fetch(`/api/works/${workId}/milestones/${milestoneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ due_date: dueDate || null })
    })
  }

  async function handleUpdateDescription(milestoneId: string, description: string) {
    setMilestones(prev =>
      prev.map(m => m.id === milestoneId ? { ...m, description } : m)
    )

    await fetch(`/api/works/${workId}/milestones/${milestoneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    })
  }

  // Drag and drop reorder
  function handleDragStart(id: string) {
    setDraggedId(id)
  }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const dragIdx = milestones.findIndex(m => m.id === draggedId)
    const targetIdx = milestones.findIndex(m => m.id === targetId)
    if (dragIdx === -1 || targetIdx === -1) return

    const newList = [...milestones]
    const [dragged] = newList.splice(dragIdx, 1)
    newList.splice(targetIdx, 0, dragged)
    setMilestones(newList)
  }

  async function handleDragEnd() {
    if (!draggedId) return
    setDraggedId(null)

    // Update sort orders in background
    const updates = milestones.map((m, i) => ({
      id: m.id,
      sort_order: i
    }))

    for (const update of updates) {
      fetch(`/api/works/${workId}/milestones/${update.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: update.sort_order })
      })
    }
  }

  const completedCount = milestones.filter(m => m.completed).length
  const totalCount = milestones.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">
              Progress: {completedCount} of {totalCount} milestones complete
            </span>
            <span className="font-black text-purple-600 dark:text-purple-400">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical timeline line */}
        {milestones.length > 0 && (
          <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-zinc-200 dark:bg-zinc-800" />
        )}

        <div className="space-y-0">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              draggable
              onDragStart={() => handleDragStart(milestone.id)}
              onDragOver={(e) => handleDragOver(e, milestone.id)}
              onDragEnd={handleDragEnd}
              className={`relative flex items-start gap-3 py-3 px-2 rounded-xl group transition-all ${
                draggedId === milestone.id ? 'opacity-40' : ''
              } hover:bg-zinc-50 dark:hover:bg-zinc-900/30`}
            >
              {/* Drag handle */}
              <div className="opacity-0 group-hover:opacity-50 cursor-grab pt-0.5 -ml-1 flex-shrink-0">
                <GripVertical className="h-4 w-4 text-zinc-400" />
              </div>

              {/* Status dot on the timeline */}
              <button
                onClick={() => handleToggleComplete(milestone)}
                className="flex-shrink-0 relative z-10 mt-0.5 cursor-pointer"
              >
                {milestone.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : index === milestones.findIndex(m => !m.completed) ? (
                  <div className="h-6 w-6 rounded-full border-2 border-purple-500 bg-purple-500/10 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                  </div>
                ) : (
                  <Circle className="h-6 w-6 text-zinc-300 dark:text-zinc-700" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  {/* Title */}
                  {editingTitleId === milestone.id ? (
                    <input
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={() => handleUpdateTitle(milestone.id)}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdateTitle(milestone.id) }}
                      autoFocus
                      className="flex-1 text-sm font-bold text-zinc-800 dark:text-zinc-200 bg-transparent border-b border-purple-500 outline-none pb-0.5"
                    />
                  ) : (
                    <h4
                      onClick={() => { setEditingTitleId(milestone.id); setEditingTitle(milestone.title) }}
                      className={`text-sm font-bold cursor-text ${
                        milestone.completed
                          ? 'line-through text-zinc-400 dark:text-zinc-600'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {milestone.title}
                    </h4>
                  )}

                  {/* Status label */}
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    milestone.completed
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : index === milestones.findIndex(m => !m.completed)
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-450'
                  }`}>
                    {milestone.completed ? 'done' : index === milestones.findIndex(m => !m.completed) ? 'in progress' : 'pending'}
                  </span>
                </div>

                {/* Date row */}
                <div className="flex items-center gap-3 text-[11px] text-zinc-450">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <input
                      type="date"
                      value={milestone.due_date || ''}
                      onChange={e => handleUpdateDueDate(milestone.id, e.target.value)}
                      className="bg-transparent border-none outline-none text-[11px] text-zinc-500 cursor-pointer"
                    />
                  </div>
                  {milestone.completed_at && (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ {new Date(milestone.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Expand/collapse description */}
                <button
                  onClick={() => setExpandedId(expandedId === milestone.id ? null : milestone.id)}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 cursor-pointer mt-1"
                >
                  {expandedId === milestone.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <span>{milestone.description ? 'Notes' : 'Add notes'}</span>
                </button>

                {expandedId === milestone.id && (
                  <textarea
                    value={milestone.description}
                    onChange={e => {
                      const val = e.target.value
                      setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, description: val } : m))
                    }}
                    onBlur={e => handleUpdateDescription(milestone.id, e.target.value)}
                    placeholder="Add notes for this milestone..."
                    className="w-full mt-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 outline-none resize-none"
                    rows={3}
                  />
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(milestone.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all cursor-pointer flex-shrink-0 mt-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add milestone */}
      <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
        <div className="flex-shrink-0">
          <Plus className="h-5 w-5 text-zinc-300 dark:text-zinc-700" />
        </div>
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder="Add milestone..."
          className="flex-1 text-sm bg-transparent outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-350"
        />
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim() || isAdding}
          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 disabled:opacity-40 cursor-pointer"
        >
          {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
        </button>
      </div>

      {/* Empty state */}
      {milestones.length === 0 && !isLoading && (
        <div className="text-center py-10 text-xs text-zinc-400">
          <p className="font-bold mb-1">No milestones yet</p>
          <p>Add milestones to track project progress step by step.</p>
        </div>
      )}
    </div>
  )
}

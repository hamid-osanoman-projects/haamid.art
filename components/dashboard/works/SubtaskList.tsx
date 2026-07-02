'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2, CheckSquare, Square } from 'lucide-react'

interface Subtask {
  id: string
  title: string
  completed: boolean
  sort_order: number
}

interface SubtaskListProps {
  workId: string
  onProgressUpdate: (progress: number) => void
}

export default function SubtaskList({ workId, onProgressUpdate }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchSubtasks()
  }, [workId])

  async function fetchSubtasks() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/works/${workId}/subtasks`)
      if (res.ok) {
        const { subtasks: data } = await res.json()
        setSubtasks(data)
        calculateProgress(data)
      }
    } catch (err) {
      console.error('Failed to load subtasks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function calculateProgress(items: Subtask[]) {
    if (items.length === 0) {
      onProgressUpdate(0)
      return
    }
    const completed = items.filter(i => i.completed).length
    const percentage = Math.round((completed / items.length) * 100)
    onProgressUpdate(percentage)
  }

  async function handleToggle(subtask: Subtask) {
    const nextCompleted = !subtask.completed
    
    // Optimistic UI update
    const updated = subtasks.map(item =>
      item.id === subtask.id ? { ...item, completed: nextCompleted } : item
    )
    setSubtasks(updated)
    calculateProgress(updated)

    try {
      await fetch(`/api/works/${workId}/subtasks/${subtask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: nextCompleted })
      })
    } catch (err) {
      console.error('Failed to toggle subtask:', err)
      fetchSubtasks() // Revert on failure
    }
  }

  async function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || isAdding) return

    setIsAdding(true)
    try {
      const res = await fetch(`/api/works/${workId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      })

      if (res.ok) {
        setNewTitle('')
        fetchSubtasks()
      }
    } catch (err) {
      console.error('Failed to add subtask:', err)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete(sid: string) {
    // Optimistic update
    const updated = subtasks.filter(item => item.id !== sid)
    setSubtasks(updated)
    calculateProgress(updated)

    try {
      await fetch(`/api/works/${workId}/subtasks/${sid}`, {
        method: 'DELETE'
      })
    } catch (err) {
      console.error('Failed to delete subtask:', err)
      fetchSubtasks()
    }
  }

  async function handleEditTitle(sid: string, newTitleVal: string) {
    if (!newTitleVal.trim()) return

    const updated = subtasks.map(item =>
      item.id === sid ? { ...item, title: newTitleVal } : item
    )
    setSubtasks(updated)

    try {
      await fetch(`/api/works/${workId}/subtasks/${sid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitleVal.trim() })
      })
    } catch (err) {
      console.error('Failed to edit subtask title:', err)
      fetchSubtasks()
    }
  }

  async function moveItem(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= subtasks.length) return

    const copy = [...subtasks]
    // Swap elements
    const temp = copy[index]
    copy[index] = copy[targetIndex]
    copy[targetIndex] = temp

    // Reassign sort orders
    const updated = copy.map((item, idx) => ({ ...item, sort_order: idx }))
    setSubtasks(updated)

    // Save orders in DB
    try {
      await Promise.all([
        fetch(`/api/works/${workId}/subtasks/${updated[index].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: updated[index].sort_order })
        }),
        fetch(`/api/works/${workId}/subtasks/${updated[targetIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: updated[targetIndex].sort_order })
        })
      ])
    } catch (err) {
      console.error('Failed to update subtask sort order:', err)
      fetchSubtasks()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-xs">Loading subtasks...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Subtask list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {subtasks.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No subtasks defined. Add some below!</p>
        ) : (
          subtasks.map((task, i) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(task)}
                  className="text-purple-500 hover:text-purple-400 cursor-pointer"
                >
                  {task.completed ? (
                    <CheckSquare className="h-4.5 w-4.5" />
                  ) : (
                    <Square className="h-4.5 w-4.5 text-zinc-400" />
                  )}
                </button>

                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => {
                    const next = [...subtasks]
                    next[i].title = e.target.value
                    setSubtasks(next)
                  }}
                  onBlur={(e) => handleEditTitle(task.id, e.target.value)}
                  className={`text-xs bg-transparent border-none outline-none flex-1 min-w-0 text-zinc-800 dark:text-zinc-200 focus:border-b focus:border-zinc-450 dark:focus:border-zinc-700 ${
                    task.completed ? 'line-through text-zinc-400 dark:text-zinc-600' : ''
                  }`}
                />
              </div>

              {/* Reordering and Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => moveItem(i, 'up')}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={i === subtasks.length - 1}
                  onClick={() => moveItem(i, 'down')}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(task.id)}
                  className="p-1 hover:bg-rose-500/10 text-rose-500 rounded cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input to add subtask */}
      <form onSubmit={handleAddSubtask} className="flex gap-2">
        <input
          type="text"
          placeholder="Add subtask (press Enter)..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={isAdding}
          className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-500 outline-none focus:border-purple-500/50"
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || isAdding}
          className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
        >
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}

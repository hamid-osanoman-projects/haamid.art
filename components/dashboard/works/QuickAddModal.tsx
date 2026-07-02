'use client'

import React, { useState } from 'react'
import { X, Loader2, Plus } from 'lucide-react'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const [title, setTitle] = useState('')
  const [track, setTrack] = useState<'company' | 'freelance' | 'personal'>('company')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          track,
          status: 'backlog',
          priority: 'medium',
          description: ''
        })
      })

      if (res.ok) {
        setTitle('')
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        alert(`Failed to quick add task: ${data.error || 'Server error'}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-2xl z-10 animate-scale-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">
            Quick Add Task (Press Esc to cancel)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="What needs to be done?"
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Select Track</label>
            <select
              value={track}
              onChange={e => setTrack(e.target.value as any)}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
            >
              <option value="company">🏢 Company Work</option>
              <option value="freelance">💼 Freelance Project</option>
              <option value="personal">🎨 Personal Project</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            <span>Quick Add Task</span>
          </button>
        </form>
      </div>
    </div>
  )
}

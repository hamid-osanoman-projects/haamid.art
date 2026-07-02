'use client'

import React, { useState } from 'react'
import { X, Calendar, Clock, Tag, MessageSquare, Loader2, Plus } from 'lucide-react'
import PrioritySelector from './PrioritySelector'

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultTrack?: 'company' | 'freelance' | 'personal'
}

export default function AddTaskModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTrack = 'company'
}: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [description, setDescription] = useState('')
  
  // Tag state
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const val = tagInput.trim().toLowerCase()
      if (!tags.includes(val)) {
        setTags([...tags, val])
      }
      setTagInput('')
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter(t => t !== tagToRemove))
  }

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
          track: defaultTrack,
          priority,
          due_date: dueDate || null,
          estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
          description: description.trim(),
          tags,
          status: 'backlog' // starts in backlog
        })
      })

      if (res.ok) {
        // Reset form
        setTitle('')
        setPriority('medium')
        setDueDate('')
        setEstimatedHours('')
        setDescription('')
        setTags([])
        
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        alert(`Failed to create task: ${data.error || 'Server error'}`)
      }
    } catch (err) {
      console.error('Failed to add task:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-2xl z-10 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">
            Create {defaultTrack} Task
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-zinc-500 block">Task Title</label>
            <input
              type="text"
              required
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-zinc-500 block">Priority Level</label>
            <PrioritySelector value={priority} onChange={setPriority} />
          </div>

          {/* Due date + Est Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-850 dark:text-zinc-200 outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Est. Hours</span>
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 4"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-850 dark:text-zinc-200 outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>Tags</span>
            </label>
            <div className="flex flex-wrap gap-1.5 items-center border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-3.5 py-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="bg-purple-500/5 text-purple-650 dark:text-purple-400 border border-purple-500/10 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1"
                >
                  <span>{tag}</span>
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500 ml-0.5">
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={tags.length === 0 ? "Press enter or comma to split..." : "+ Add..."}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                disabled={isSubmitting}
                className="bg-transparent border-none outline-none text-xs flex-1 min-w-[80px] text-zinc-850 dark:text-zinc-200"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-zinc-500 block">Description (optional)</label>
            <textarea
              placeholder="Describe scope, reference links, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

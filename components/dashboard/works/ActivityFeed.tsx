'use client'

import React, { useState, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface UpdateLog {
  id: string
  content: string
  created_at: string
}

interface ActivityFeedProps {
  workId: string
}

export default function ActivityFeed({ workId }: ActivityFeedProps) {
  const [updates, setUpdates] = useState<UpdateLog[]>([])
  const [newUpdate, setNewUpdate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUpdates()
  }, [workId])

  async function fetchUpdates() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/works/${workId}/updates`)
      if (res.ok) {
        const { updates: data } = await res.json()
        setUpdates(data)
      }
    } catch (err) {
      console.error('Failed to load updates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddUpdate() {
    if (!newUpdate.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/works/${workId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newUpdate.trim() })
      })

      if (res.ok) {
        setNewUpdate('')
        fetchUpdates()
      }
    } catch (err) {
      console.error('Failed to post update:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleAddUpdate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-xs">Loading activity logs...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Activity append textarea */}
      <div className="relative">
        <textarea
          placeholder="Add an update... (Ctrl+Enter to post)"
          value={newUpdate}
          onChange={(e) => setNewUpdate(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          rows={3}
          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 pr-12 text-xs text-zinc-800 dark:text-zinc-150 placeholder-zinc-500 outline-none focus:border-purple-500/50 resize-none"
        />
        <button
          type="button"
          onClick={handleAddUpdate}
          disabled={!newUpdate.trim() || isSubmitting}
          className="absolute right-3.5 bottom-4 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all cursor-pointer disabled:opacity-40"
        >
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Activity logs history */}
      <div className="space-y-3">
        <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Activity Log</h4>
        
        <div className="max-h-[260px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
          {updates.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No activity updates logged for this task.</p>
          ) : (
            updates.map((up) => {
              const date = new Date(up.created_at)
              const formattedHeader = date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) + ' @ ' + date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
              })

              return (
                <div key={up.id} className="relative pl-4 border-l border-zinc-200 dark:border-zinc-800 space-y-0.5">
                  {/* Timeline dot */}
                  <div className="absolute left-[-4.5px] top-1.5 h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-650 block">
                    {formattedHeader}
                  </span>
                  
                  <p className="text-xs text-zinc-750 dark:text-zinc-300 leading-relaxed font-semibold">
                    {up.content}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

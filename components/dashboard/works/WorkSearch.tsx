'use client'

import React from 'react'
import { Search, X } from 'lucide-react'

interface WorkSearchProps {
  value: string
  onChange: (newValue: string) => void
}

export default function WorkSearch({ value, onChange }: WorkSearchProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
      
      <input
        type="text"
        placeholder="Search tasks, descriptions, or tags..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1.5 pr-8 pl-9 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 outline-none rounded-xl focus:border-purple-500/50 transition-colors"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-650 cursor-pointer transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

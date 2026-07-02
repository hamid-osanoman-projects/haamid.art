'use client'

import React from 'react'

export interface FilterState {
  today: boolean
  thisWeek: boolean
  overdue: boolean
  blocked: boolean
  highPriority: boolean
}

interface WorkFiltersProps {
  filters: FilterState
  onChange: (newFilters: FilterState) => void
}

export default function WorkFilters({ filters, onChange }: WorkFiltersProps) {
  const isAll = !filters.today && !filters.thisWeek && !filters.overdue && !filters.blocked && !filters.highPriority

  function toggleFilter(key: keyof FilterState) {
    onChange({
      ...filters,
      [key]: !filters[key]
    })
  }

  function clearAll() {
    onChange({
      today: false,
      thisWeek: false,
      overdue: false,
      blocked: false,
      highPriority: false
    })
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        onClick={clearAll}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
          isAll
            ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
        }`}
      >
        All Works
      </button>

      <button
        type="button"
        onClick={() => toggleFilter('today')}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
          filters.today
            ? 'bg-purple-650 border-purple-650 text-white shadow-sm'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
        }`}
      >
        📆 Today
      </button>

      <button
        type="button"
        onClick={() => toggleFilter('thisWeek')}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
          filters.thisWeek
            ? 'bg-purple-650 border-purple-650 text-white shadow-sm'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
        }`}
      >
        ◎ This Week
      </button>

      <button
        type="button"
        onClick={() => toggleFilter('overdue')}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
          filters.overdue
            ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-rose-500/5 dark:hover:bg-rose-500/5 hover:border-rose-500/30'
        }`}
      >
        ⚠️ Overdue
      </button>

      <button
        type="button"
        onClick={() => toggleFilter('blocked')}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
          filters.blocked
            ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-rose-500/5 dark:hover:bg-rose-500/5 hover:border-rose-500/30'
        }`}
      >
        ⊗ Blocked
      </button>

      <button
        type="button"
        onClick={() => toggleFilter('highPriority')}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
          filters.highPriority
            ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
        }`}
      >
        🔴 High & Urgent
      </button>
    </div>
  )
}

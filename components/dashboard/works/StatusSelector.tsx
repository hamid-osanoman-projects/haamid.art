'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export const statuses = [
  { value: 'backlog',     label: 'Backlog',     icon: '○',  color: '#737373' },
  { value: 'this_week',   label: 'This week',   icon: '◎',  color: '#3B82F6' },
  { value: 'in_progress', label: 'In progress', icon: '●',  color: '#7F77DD' },
  { value: 'blocked',     label: 'Blocked',     icon: '⊗',  color: '#EF4444' },
  { value: 'in_review',   label: 'In review',   icon: '◑',  color: '#F59E0B' },
  { value: 'done',        label: 'Done',        icon: '✓',  color: '#22C55E' },
  { value: 'cancelled',   label: 'Cancelled',   icon: '✕',  color: '#525252' },
  { value: 'on_hold',     label: 'On hold',     icon: '⏸',  color: '#A855F7' },
]

interface StatusSelectorProps {
  value: string
  onChange: (newValue: string) => void
}

export default function StatusSelector({ value, onChange }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const currentStatus = statuses.find(s => s.value === value) || statuses[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
      >
        <span style={{ color: currentStatus.color }} className="text-[14px] leading-none">
          {currentStatus.icon}
        </span>
        <span>{currentStatus.label}</span>
        <ChevronDown className="h-3 w-3 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-lg z-50 animate-scale-up">
          {statuses.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => {
                onChange(status.value)
                setIsOpen(false)
              }}
              className={`flex w-full items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer ${
                value === status.value
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span style={{ color: status.color }} className="text-[14px] leading-none">
                {status.icon}
              </span>
              <span>{status.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

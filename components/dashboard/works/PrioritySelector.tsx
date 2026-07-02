'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export const priorities = [
  { value: 'urgent', label: 'Urgent', color: '#EF4444', icon: '🔴', description: 'Drop everything' },
  { value: 'high',   label: 'High',   color: '#F97316', icon: '🟠', description: 'Do this week' },
  { value: 'medium', label: 'Medium', color: '#3B82F6', icon: '🔵', description: 'Do this sprint' },
  { value: 'low',    label: 'Low',    color: '#737373', icon: '⚪', description: 'Do when time allows' },
]

interface PrioritySelectorProps {
  value: string
  onChange: (newValue: string) => void
}

export default function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentPriority = priorities.find(p => p.value === value) || priorities[2]

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
        <span className="text-[10px] leading-none">{currentPriority.icon}</span>
        <span>{currentPriority.label}</span>
        <ChevronDown className="h-3 w-3 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-lg z-50 animate-scale-up">
          {priorities.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                onChange(p.value)
                setIsOpen(false)
              }}
              className={`flex w-full flex-col px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer ${
                value === p.value
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] leading-none">{p.icon}</span>
                <span>{p.label}</span>
              </div>
              <span className="text-[9px] font-normal text-zinc-400 dark:text-zinc-550 mt-0.5 ml-4.5 block">
                {p.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

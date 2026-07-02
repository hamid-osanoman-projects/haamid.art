'use client'

import React, { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import TaskCard from './TaskCard'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
}

interface KanbanColumnProps {
  status: string
  label: string
  icon: string
  color: string
  tasks: Task[]
  onCardClick: (taskId: string, tab?: 'details' | 'subtasks' | 'time' | 'updates' | 'attachments') => void
  onUpdate: () => void
}

export default function KanbanColumn({
  status,
  label,
  icon,
  color,
  tasks,
  onCardClick,
  onUpdate
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const isDoneCol = status === 'done'
  const displayTasks = isDoneCol && tasks.length > 10 && !isExpanded
    ? tasks.slice(0, 10)
    : tasks

  const collapsedCount = tasks.length - 10

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 h-[calc(100vh-230px)] rounded-2xl p-3 border transition-colors flex-shrink-0 select-none ${
        isOver
          ? 'bg-purple-500/5 border-purple-550/30'
          : 'bg-zinc-50/50 dark:bg-zinc-950/10 border-zinc-100 dark:border-zinc-900'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span style={{ color }} className="text-xs leading-none font-semibold">
            {icon}
          </span>
          <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {label}
          </h3>
          <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded-lg font-bold">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Cards Scrollbox Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {displayTasks.length === 0 ? (
          <div className="h-28 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl flex items-center justify-center text-[10px] text-zinc-400">
            Drop tasks here
          </div>
        ) : (
          displayTasks.map(task => (
            <TaskCardWrapper
              key={task.id}
              task={task}
              onCardClick={onCardClick}
              onUpdate={onUpdate}
            />
          ))
        )}

        {/* Done Column Collapse controls */}
        {isDoneCol && tasks.length > 10 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-200 transition-colors text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                <span>Show {collapsedCount} more tasks</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// Draggable wrapper using @dnd-kit/core
import { useDraggable } from '@dnd-kit/core'

interface TaskCardWrapperProps {
  task: Task
  onCardClick: (taskId: string, tab?: 'details' | 'subtasks' | 'time' | 'updates' | 'attachments') => void
  onUpdate: () => void
}

function TaskCardWrapper({ task, onCardClick, onUpdate }: TaskCardWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  })

  // Apply visual translate transform when dragging
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.3 : undefined,
        zIndex: 50
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-none"
    >
      <TaskCard
        task={task}
        onClick={(tab) => onCardClick(task.id, tab)}
        onUpdate={onUpdate}
      />
    </div>
  )
}

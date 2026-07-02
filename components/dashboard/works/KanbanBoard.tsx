'use client'

import React from 'react'
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import KanbanColumn from './KanbanColumn'
import { statuses } from './StatusSelector'

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

interface KanbanBoardProps {
  tasks: Task[]
  onCardClick: (taskId: string, tab?: 'details' | 'subtasks' | 'time' | 'updates' | 'attachments') => void
  onUpdate: () => void
  onOptimisticStatusChange: (taskId: string, newStatus: string) => void
}

export default function KanbanBoard({
  tasks,
  onCardClick,
  onUpdate,
  onOptimisticStatusChange
}: KanbanBoardProps) {
  // Use PointerSensor with distance constraint so clicks inside cards are not consumed as drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as string

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // 1. Trigger optimistic status swap on parent state to avoid drag visual lag
    onOptimisticStatusChange(taskId, newStatus)

    // 2. Perform background API call
    try {
      const res = await fetch(`/api/works/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) {
        throw new Error('API save failed')
      }
      onUpdate() // refresh details from DB
    } catch (err) {
      console.error('Failed to save drag status:', err)
      onUpdate() // revert local state on failure
    }
  }

  // Filter columns: Blocked is hidden if it contains 0 tasks
  const hasBlockedTasks = tasks.some(t => t.status === 'blocked')
  const activeStatuses = statuses.filter(s => {
    if (s.value === 'blocked' && !hasBlockedTasks) return false
    return true
  })

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin max-w-full items-start">
        {activeStatuses.map((statusMeta) => {
          const columnTasks = tasks.filter(t => t.status === statusMeta.value)
          return (
            <KanbanColumn
              key={statusMeta.value}
              status={statusMeta.value}
              label={statusMeta.label}
              icon={statusMeta.icon}
              color={statusMeta.color}
              tasks={columnTasks}
              onCardClick={onCardClick}
              onUpdate={onUpdate}
            />
          )
        })}
      </div>
    </DndContext>
  )
}

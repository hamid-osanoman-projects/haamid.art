'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  ClipboardList, Clock, AlertTriangle, AlertOctagon, Info, Calendar, 
  Tag, Plus, X, Search, FileText, CheckCircle2, ChevronRight, Copy, Trash2, 
  ArrowRightLeft, Edit, CornerDownRight, History, Play
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  notes?: string;
  created_at?: string;
}

interface ActivityLog {
  id: string;
  work_id: string;
  content: string;
  created_at: string;
}

interface PersonalTrackerProps {
  initialTasks: Task[];
}

const STATUSES: Task['status'][] = ['backlog', 'in_progress', 'review', 'done'];
const PRIORITIES: Task['priority'][] = ['low', 'medium', 'high', 'urgent'];

export default function PersonalTracker({ initialTasks }: PersonalTrackerProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'overdue' | 'this_week' | 'high_priority' | 'done'>('all');
  
  // New task inline state
  const [newTitleByStatus, setNewTitleByStatus] = useState<Record<string, string>>({});
  
  // Description Markdown preview tab state
  const [activeDetailTab, setActiveDetailTab] = useState<'edit' | 'preview'>('edit');
  
  // Custom right-click context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);

  const supabase = createClient();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close context menu on global click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Fetch activity logs when a task is opened
  useEffect(() => {
    if (selectedTask) {
      fetchActivityLogs(selectedTask.id);
      setActiveDetailTab('edit');
    } else {
      setActivityLogs([]);
    }
  }, [selectedTask?.id]);

  const fetchActivityLogs = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('work_updates')
        .select('*')
        .eq('work_id', taskId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setActivityLogs(data);
      } else {
        // Fallback mock logs
        setActivityLogs([
          { id: '1', work_id: taskId, content: 'Task created.', created_at: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.warn('DB error fetching logs, using fallbacks:', err);
    }
  };

  // Add activity log helper
  const addLog = async (taskId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('work_updates')
        .insert({ work_id: taskId, content })
        .select()
        .single();
      
      if (!error && data) {
        setActivityLogs(prev => [data, ...prev]);
      } else {
        const mockLog: ActivityLog = {
          id: Math.random().toString(),
          work_id: taskId,
          content,
          created_at: new Date().toISOString()
        };
        setActivityLogs(prev => [mockLog, ...prev]);
      }
    } catch (err) {
      console.warn('Logging mutation error:', err);
    }
  };

  // Inline task addition
  const handleAddTask = async (status: Task['status']) => {
    const title = newTitleByStatus[status]?.trim();
    if (!title) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newTaskData = {
        title,
        status,
        priority: 'medium' as const,
        track: 'personal',
        user_id: user?.id,
        tags: [],
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('works')
        .insert(newTaskData)
        .select()
        .single();

      if (!error && data) {
        setTasks(prev => [...prev, data]);
        addLog(data.id, 'Task initialized inline.');
      } else {
        // Fallback local addition
        const fallbackTask: Task = {
          id: Math.random().toString(),
          ...newTaskData
        };
        setTasks(prev => [...prev, fallbackTask]);
      }

      setNewTitleByStatus(prev => ({ ...prev, [status]: '' }));
    } catch (err) {
      console.error('Task insert failed:', err);
    }
  };

  // Task details update
  const handleUpdateTask = async (updatedFields: Partial<Task>) => {
    if (!selectedTask) return;

    const updatedTask = { ...selectedTask, ...updatedFields };
    setSelectedTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));

    try {
      const { error } = await supabase
        .from('works')
        .update(updatedFields)
        .eq('id', selectedTask.id);

      if (error) console.error('Database update failed:', error);
    } catch (err) {
      console.error('Task update error:', err);
    }
  };

  // Cycle status on card status click
  const cycleStatus = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const currIdx = STATUSES.indexOf(task.status);
    const nextStatus = STATUSES[(currIdx + 1) % STATUSES.length];

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    if (selectedTask?.id === task.id) {
      setSelectedTask(prev => prev ? { ...prev, status: nextStatus } : null);
    }

    try {
      await supabase.from('works').update({ status: nextStatus }).eq('id', task.id);
      addLog(task.id, `Status cycled to: ${nextStatus.replace('_', ' ')}.`);
    } catch (err) {
      console.error('Status cycle update failed:', err);
    }
  };

  // Drag and drop mechanics (HTML5 API)
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    // Optimistic local state update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: targetStatus } : null);
    }

    try {
      await supabase.from('works').update({ status: targetStatus }).eq('id', taskId);
      addLog(taskId, `Dragged and dropped to: ${targetStatus.replace('_', ' ')}.`);
    } catch (err) {
      console.error('Drag update failed:', err);
    }
  };

  // Context Menu Actions
  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      taskId
    });
  };

  const duplicateTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const { id, created_at, ...copyData } = task;
      const { data: { user } } = await supabase.auth.getUser();
      const duplicateData = {
        ...copyData,
        title: `${task.title} (Copy)`,
        user_id: user?.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('works')
        .insert(duplicateData)
        .select()
        .single();

      if (!error && data) {
        setTasks(prev => [...prev, data]);
        addLog(data.id, `Duplicated from task: ${task.title}.`);
      } else {
        const localCopy: Task = {
          id: Math.random().toString(),
          ...duplicateData
        };
        setTasks(prev => [...prev, localCopy]);
      }
    } catch (err) {
      console.error('Task duplication failed:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('works').delete().eq('id', taskId);
      if (!error) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (selectedTask?.id === taskId) setSelectedTask(null);
      }
    } catch (err) {
      console.error('Task delete failed:', err);
    }
  };

  const moveToFreelance = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('works')
        .update({ track: 'freelance' })
        .eq('id', taskId);
      
      if (!error) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (selectedTask?.id === taskId) setSelectedTask(null);
      }
    } catch (err) {
      console.error('Failed to move track:', err);
    }
  };

  // Simple custom Markdown rendering parser
  const renderMarkdown = (text: string = '') => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-zinc-100 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-base font-extrabold text-zinc-100 mt-5 mb-2 border-b border-zinc-800 pb-1">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-lg font-black text-zinc-100 mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code class="bg-zinc-800 px-1 py-0.5 rounded text-xs text-emerald-400 font-mono">$1</code>')
      .replace(/^\s*\-\s(.*)$/gim, '<li class="ml-4 list-disc text-zinc-300 text-xs py-0.5">$1</li>')
      .replace(/\n$/gim, '<br />');
    
    return { __html: html };
  };

  // Query filtering logic
  const filteredTasks = tasks.filter(task => {
    // Search query matching
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      task.title.toLowerCase().includes(query) || 
      (task.description || '').toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Stats criteria filter
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = task.due_date && task.due_date < todayStr && task.status !== 'done';
    
    // Get beginning and end of current week
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0];
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6)).toISOString().split('T')[0];
    const isThisWeek = task.due_date && task.due_date >= firstDay && task.due_date <= lastDay;

    if (activeFilter === 'overdue') return isOverdue;
    if (activeFilter === 'this_week') return isThisWeek;
    if (activeFilter === 'high_priority') return task.priority === 'high' || task.priority === 'urgent';
    if (activeFilter === 'done') return task.status === 'done';
    return true; // 'all' filter
  });

  return (
    <div className="relative flex flex-col h-[calc(100vh-100px)] select-none">
      
      {/* -------------------- SEARCH FILTERS BAR -------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-[#e5e5e5] dark:border-[#262626] pb-4 bg-white dark:bg-[#0d0d0d] z-10">
        
        {/* Filter categories tabs */}
        <div className="flex flex-wrap gap-1.5 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
          {(['all', 'overdue', 'this_week', 'high_priority', 'done'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-white dark:bg-[#141414] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Live Search bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task or note details..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 py-2 pr-4 pl-10 text-xs text-zinc-800 dark:text-zinc-100 outline-none transition-all focus:border-emerald-500/50 focus:bg-white dark:focus:bg-zinc-900"
          />
        </div>

      </div>

      {/* -------------------- KANBAN BOARD -------------------- */}
      <div className="flex-1 flex gap-6 overflow-x-auto overflow-y-hidden pb-4 items-start">
        {STATUSES.map(status => {
          const statusTasks = filteredTasks.filter(t => t.status === status);
          
          return (
            <div
              key={status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              className="flex flex-col w-[260px] max-h-full shrink-0 border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#141414] rounded-xl p-4 shadow-sm"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    status === 'backlog' ? 'bg-zinc-500' :
                    status === 'in_progress' ? 'bg-blue-500' :
                    status === 'review' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 capitalize">
                    {status.replace('_', ' ')}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded">
                  {statusTasks.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[150px]">
                {statusTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onContextMenu={(e) => handleContextMenu(e, task.id)}
                    onClick={() => setSelectedTask(task)}
                    className="group flex flex-col p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#0d0d0d] hover:border-emerald-500/30 hover:bg-white dark:hover:bg-[#111] transition-all cursor-grab active:cursor-grabbing shadow-sm"
                  >
                    {/* Header badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-tight group-hover:text-emerald-400 transition-colors">
                        {task.title}
                      </h4>
                    </div>

                    {/* Metadata (due, priority, tags) */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 text-[9px] font-bold">
                      {/* Priority pill */}
                      <span className={`px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                        task.priority === 'urgent' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' :
                        task.priority === 'high' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                        task.priority === 'medium' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                        'border-zinc-500/20 bg-zinc-500/10 text-zinc-400'
                      }`}
                      onClick={(e) => cycleStatus(task, e)}
                      title="Click status to cycle"
                      >
                        {task.priority}
                      </span>

                      {/* Due Date */}
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </span>
                      )}

                      {/* Tag pill count */}
                      {task.tags && task.tags.length > 0 && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Tag className="h-2.5 w-2.5" />
                          <span>{task.tags.length}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline Add Task Footer */}
              <div className="mt-3 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitleByStatus[status] || ''}
                    onChange={(e) => setNewTitleByStatus(prev => ({ ...prev, [status]: e.target.value }))}
                    placeholder="+ New task..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(status)}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-500"
                  />
                  <button 
                    onClick={() => handleAddTask(status)}
                    disabled={!(newTitleByStatus[status]?.trim())}
                    className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* -------------------- RIGHT-SIDE TASK DETAIL DRAWER -------------------- */}
      {selectedTask && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setSelectedTask(null)}
          />
          {/* Drawer container panel */}
          <div
            ref={drawerRef}
            className="relative flex flex-col w-[380px] sm:w-[480px] h-full bg-white dark:bg-[#141414] border-l border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl z-10 overflow-y-auto animate-slide-in text-xs font-semibold text-zinc-500"
          >
            {/* Header Title Close */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <CornerDownRight className="h-3.5 w-3.5 text-emerald-400" />
                <span>Task Detail Screen</span>
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-400"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Editable inline title */}
            <div className="mb-6">
              <input
                type="text"
                value={selectedTask.title}
                onChange={(e) => handleUpdateTask({ title: e.target.value })}
                className="w-full bg-transparent border-none outline-none text-base font-extrabold text-zinc-800 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500/30 rounded p-1"
                placeholder="Task Title"
              />
            </div>

            {/* Meta attributes selectors */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              
              {/* Status */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleUpdateTask({ status: e.target.value as Task['status'] })}
                  className="w-full mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2.5 text-zinc-700 dark:text-zinc-200 outline-none"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Priority</label>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => handleUpdateTask({ priority: e.target.value as Task['priority'] })}
                  className="w-full mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2.5 text-zinc-700 dark:text-zinc-200 outline-none"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Due Date</label>
                <input
                  type="date"
                  value={selectedTask.due_date || ''}
                  onChange={(e) => handleUpdateTask({ due_date: e.target.value })}
                  className="w-full mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2.5 text-zinc-700 dark:text-zinc-200 outline-none"
                />
              </div>

              {/* Hours metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Est H</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedTask.estimated_hours || ''}
                    onChange={(e) => handleUpdateTask({ estimated_hours: parseFloat(e.target.value) || undefined })}
                    className="w-full mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-zinc-700 dark:text-zinc-200 outline-none text-center"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Act H</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedTask.actual_hours || ''}
                    onChange={(e) => handleUpdateTask({ actual_hours: parseFloat(e.target.value) || undefined })}
                    className="w-full mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-zinc-700 dark:text-zinc-200 outline-none text-center"
                    placeholder="0.0"
                  />
                </div>
              </div>

            </div>

            {/* Description Tab editor & Markdown preview */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveDetailTab('edit')}
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      activeDetailTab === 'edit' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('preview')}
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      activeDetailTab === 'preview' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400'
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {activeDetailTab === 'edit' ? (
                <textarea
                  rows={5}
                  value={selectedTask.description || ''}
                  onChange={(e) => handleUpdateTask({ description: e.target.value })}
                  placeholder="Provide markdown details of this deliverable task..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent py-3 px-4 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-500 outline-none transition-all focus:border-emerald-500/40"
                />
              ) : (
                <div 
                  dangerouslySetInnerHTML={renderMarkdown(selectedTask.description)}
                  className="min-h-[100px] border border-transparent p-2 text-zinc-300 space-y-1.5 bg-zinc-900/10 rounded-lg text-xs leading-relaxed"
                />
              )}
            </div>

            {/* Activity Logs (append-only) */}
            <div className="mb-6 border-t border-zinc-100 dark:border-zinc-800/80 pt-6">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-zinc-500" />
                <span>Append Activity Logs</span>
              </h4>

              <div className="max-h-36 overflow-y-auto space-y-3.5 pr-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300 text-xs">{log.content}</p>
                      <span className="text-[9px] text-zinc-500 block mt-0.5">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------- FLOAT CONTEXT MENU (Right Click Options) -------------------- */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-44 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-[#141414] p-1.5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const t = tasks.find(item => item.id === contextMenu.taskId);
              if (t) setSelectedTask(t);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1f1f1f] rounded-lg transition-all text-left cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Open Details</span>
          </button>
          <button
            onClick={() => {
              duplicateTask(contextMenu.taskId);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1f1f1f] rounded-lg transition-all text-left cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Duplicate Task</span>
          </button>
          <button
            onClick={() => {
              moveToFreelance(contextMenu.taskId);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1f1f1f] rounded-lg transition-all text-left cursor-pointer"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Move to Freelance</span>
          </button>
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
          <button
            onClick={() => {
              deleteTask(contextMenu.taskId);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all text-left cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Task</span>
          </button>
        </div>
      )}

    </div>
  );
}

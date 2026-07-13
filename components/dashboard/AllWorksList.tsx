'use client';

import React, { useState } from 'react';
import { 
  Briefcase, Folder, User, CheckCircle2, AlertTriangle, 
  Clock, TrendingUp, Sparkles, Plus, ArrowUpRight, Calendar, ListTodo
} from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  status: string;
  track: 'company' | 'freelance' | 'personal';
  priority: string;
  due_date?: string;
  actual_hours?: number;
  estimated_hours?: number;
}

interface AllWorksListProps {
  tasks: Task[];
  pageTitle: string;
  pageSubtitle: string;
}

export default function AllWorksList({ tasks, pageTitle, pageSubtitle }: AllWorksListProps) {
  const [filterTrack, setFilterTrack] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks = tasks.filter(t => {
    if (filterTrack !== 'all' && t.track !== filterTrack) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] select-none max-w-6xl w-full min-w-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">{pageTitle}</h2>
          <p className="text-zinc-500 text-sm font-semibold mt-1">{pageSubtitle}</p>
        </div>
        
        <div className="flex gap-4 mt-4 sm:mt-0">
          <select 
            value={filterTrack} 
            onChange={(e) => setFilterTrack(e.target.value)}
            className="text-xs font-bold uppercase tracking-wider bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 outline-none"
          >
            <option value="all">All Tracks</option>
            <option value="company">Company</option>
            <option value="freelance">Freelance</option>
            <option value="personal">Personal</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-bold uppercase tracking-wider bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-hidden flex-1 flex flex-col">
          {/* Desktop Table View */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-zinc-50 dark:bg-[#0d0d0d] border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Task Title</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Track</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Priority</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Due Date</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Hours (Act/Est)</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{task.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                        task.track === 'company' ? 'border-purple-500/20 bg-purple-500/10 text-purple-400' :
                        task.track === 'freelance' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                        'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {task.track}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        task.priority === 'urgent' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' :
                        task.priority === 'high' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                        task.priority === 'medium' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                        'border-zinc-500/20 bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-zinc-500">
                      {task.actual_hours || 0} / {task.estimated_hours || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/works/${task.track}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-500 hover:text-purple-400"
                      >
                        Manage <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-xs font-bold">
                    No tasks found matching these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-y-auto">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div key={task.id} className="p-4 flex flex-col gap-3 hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200 leading-tight">
                      {task.title}
                    </div>
                    <Link 
                      href={`/dashboard/works/${task.track}`}
                      className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white transition-colors"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                      task.track === 'company' ? 'border-purple-500/20 bg-purple-500/10 text-purple-400' :
                      task.track === 'freelance' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                      'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {task.track}
                    </span>
                    
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {task.status.replace('_', ' ')}
                    </span>
                    
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                      task.priority === 'urgent' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' :
                      task.priority === 'high' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                      task.priority === 'medium' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                      'border-zinc-500/20 bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1 border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None'}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500">
                      <span className="text-zinc-400">Hrs:</span> {task.actual_hours || 0} / {task.estimated_hours || 0}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs font-bold">
                No tasks found matching these filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

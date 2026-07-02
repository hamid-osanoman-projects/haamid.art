'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Briefcase, Folder, User, CheckCircle2, AlertTriangle, 
  Clock, TrendingUp, Sparkles, Plus, ArrowUpRight
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  track: 'company' | 'freelance' | 'personal';
  priority: string;
}

interface ActivityLog {
  id: string;
  content: string;
  created_at: string;
}

interface WorksOverviewProps {
  tasks: Task[];
  recentLogs: ActivityLog[];
}

export default function WorksOverview({ tasks, recentLogs }: WorksOverviewProps) {
  const companyTasks = tasks.filter(t => t.track === 'company');
  const freelanceTasks = tasks.filter(t => t.track === 'freelance');
  const personalTasks = tasks.filter(t => t.track === 'personal');

  const stats = [
    { 
      label: 'Company', 
      count: companyTasks.length, 
      active: companyTasks.filter(t => t.status === 'in_progress').length,
      icon: Briefcase,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      href: '/dashboard/works/company'
    },
    { 
      label: 'Freelance', 
      count: freelanceTasks.length, 
      active: freelanceTasks.filter(t => t.status === 'in_progress').length,
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      href: '/dashboard/works/freelance'
    },
    { 
      label: 'Personal', 
      count: personalTasks.length, 
      active: personalTasks.filter(t => t.status === 'in_progress').length,
      icon: User,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      href: '/dashboard/works/personal'
    }
  ];

  const totalDone = tasks.filter(t => t.status === 'done' || t.status === 'review').length;
  const totalActive = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div className="space-y-8 select-none font-sans max-w-6xl">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-[#141414] to-[#141414] p-8 shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Sparkles className="h-32 w-32 text-purple-400 animate-pulse" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Works Overview</h2>
            <p className="text-zinc-400 mt-2 font-medium max-w-md text-sm">
              You currently have <strong className="text-purple-400">{totalActive} active tasks</strong> in progress across all tracks. Keep up the momentum!
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center bg-black/40 backdrop-blur-md rounded-xl border border-white/5 p-4 min-w-[100px]">
              <span className="block text-2xl font-black text-emerald-400">{totalDone}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Completed</span>
            </div>
            <div className="text-center bg-black/40 backdrop-blur-md rounded-xl border border-white/5 p-4 min-w-[100px]">
              <span className="block text-2xl font-black text-amber-400">{tasks.length}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Track Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link 
              key={idx} 
              href={stat.href}
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-6 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-8">
                <div className={`p-3 rounded-xl border ${stat.border} ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <ArrowUpRight className="h-4 w-4 text-zinc-500" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-extrabold text-zinc-800 dark:text-zinc-100">{stat.label}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs font-bold text-zinc-500">{stat.count} Total Tasks</span>
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-extrabold tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded">
                    <span className={`h-1.5 w-1.5 rounded-full ${stat.active > 0 ? stat.color.replace('text-', 'bg-') : 'bg-zinc-500'}`} />
                    {stat.active} Active
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity Logs */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            Recent Activity
          </h3>
          <Link href="/dashboard/works/time" className="text-[10px] uppercase font-bold tracking-wider text-purple-500 hover:text-purple-400">
            View Time Logs
          </Link>
        </div>
        
        {recentLogs.length > 0 ? (
          <div className="space-y-4">
            {recentLogs.map((log, i) => (
              <div key={log.id} className="flex gap-4 relative">
                {/* Timeline vertical line */}
                {i !== recentLogs.length - 1 && (
                  <div className="absolute top-6 left-[11px] bottom-[-16px] w-[2px] bg-zinc-100 dark:bg-zinc-800/50" />
                )}
                
                <div className="relative mt-1">
                  <div className="h-6 w-6 rounded-full border border-purple-500/20 bg-purple-950/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                  </div>
                </div>
                <div className="flex-1 bg-zinc-50 dark:bg-[#0d0d0d] border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-3">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {log.content}
                  </p>
                  <span className="text-[10px] font-bold text-zinc-500 mt-1 block">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-50 dark:bg-[#0d0d0d] rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-500">No recent activity logs.</p>
          </div>
        )}
      </div>

    </div>
  );
}

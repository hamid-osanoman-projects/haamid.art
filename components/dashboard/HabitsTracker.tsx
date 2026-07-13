'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Check, X, Calendar as CalendarIcon, Activity, Book, Monitor, Footprints, ShieldAlert, Zap, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';

export type Habit = {
  id: string;
  name: string;
  description: string;
  frequency: string;
  color: string;
  icon: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  log_date: string;
  status: 'completed' | 'skipped' | 'failed';
};

const ICONS = {
  Activity, Book, Monitor, Footprints, ShieldAlert, Zap
} as Record<string, any>;

const COLORS = [
  '#7F77DD', '#F43F5E', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'
];

// Fallback initial mock data if DB is empty
const MOCK_HABITS: Habit[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Reading', description: 'Read 20 pages', frequency: 'daily', color: '#3B82F6', icon: 'Book' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Studying', description: 'Deep work 2 hours', frequency: 'daily', color: '#8B5CF6', icon: 'Monitor' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Walking', description: '10,000 steps', frequency: 'daily', color: '#10B981', icon: 'Footprints' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'No Fap', description: 'Stay disciplined', frequency: 'daily', color: '#F43F5E', icon: 'ShieldAlert' },
];

export default function HabitsTracker({ initialHabits, initialLogs }: { initialHabits: Habit[], initialLogs: HabitLog[] }) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits.length > 0 ? initialHabits : MOCK_HABITS);
  const [logs, setLogs] = useState<HabitLog[]>(initialLogs);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState({ name: '', description: '', color: COLORS[0], icon: 'Activity' });

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  // Compute current date safely
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
  
  // Dynamic array for calendar grid based on selected view mode
  const calendarDays = React.useMemo(() => {
    const days: string[] = [];
    if (viewMode === 'week') {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - d.getDay()); // Start on Sunday
      for (let i = 0; i < 7; i++) {
        days.push(new Date(d).toLocaleDateString('en-CA'));
        d.setDate(d.getDate() + 1);
      }
    } else {
      const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      const month = d.getMonth();
      while (d.getMonth() === month) {
        days.push(new Date(d).toLocaleDateString('en-CA'));
        d.setDate(d.getDate() + 1);
      }
    }
    return days;
  }, [viewMode, referenceDate]);

  const handlePrev = () => {
    setReferenceDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'week') d.setDate(d.getDate() - 7);
      else d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setReferenceDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'week') d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const getLogForDate = (habitId: string, date: string) => {
    return logs.find(l => l.habit_id === habitId && l.log_date === date);
  };

  const handleToggleHabit = async (habitId: string, date: string, currentStatus?: string) => {
    // Cycle: none -> completed -> failed -> none
    let newStatus: 'completed' | 'failed' | null = null;
    
    if (!currentStatus) newStatus = 'completed';
    else if (currentStatus === 'completed') newStatus = 'failed';
    else newStatus = null;

    const supabase = createClient();
    const existingLog = getLogForDate(habitId, date);

    try {
      if (newStatus) {
        if (existingLog) {
          // Update
          const { error } = await supabase.from('habit_logs').update({ status: newStatus }).eq('id', existingLog.id);
          if (!error) {
            setLogs(prev => prev.map(l => l.id === existingLog.id ? { ...l, status: newStatus as 'completed' | 'failed' } : l));
          } else throw error;
        } else {
          // Insert
          const { data, error } = await supabase.from('habit_logs').insert({ habit_id: habitId, log_date: date, status: newStatus }).select().single();
          if (data) {
            setLogs(prev => [...prev, data]);
          } else throw error;
        }
      } else {
        // Delete
        if (existingLog) {
          const { error } = await supabase.from('habit_logs').delete().eq('id', existingLog.id);
          if (!error) {
            setLogs(prev => prev.filter(l => l.id !== existingLog.id));
          } else throw error;
        }
      }
    } catch (err) {
      console.warn("DB toggle failed, updating optimistic UI only:", err);
      
      // Optimistic UI update for mock environments
      if (newStatus) {
        if (existingLog) {
          setLogs(prev => prev.map(l => l.id === existingLog.id ? { ...l, status: newStatus as 'completed' | 'failed' } : l));
        } else {
          setLogs(prev => [...prev, { id: crypto.randomUUID(), habit_id: habitId, log_date: date, status: newStatus as 'completed' | 'failed' }]);
        }
      } else {
        setLogs(prev => prev.filter(l => l.id !== existingLog?.id));
      }
    }
  };

  const handleSaveHabit = async () => {
    if (!newHabit.name.trim()) return;

    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      
      const payload = {
        name: newHabit.name,
        description: newHabit.description,
        color: newHabit.color,
        icon: newHabit.icon,
        frequency: 'daily'
      };

      if (editingHabitId) {
        // Edit mode
        const { error } = await supabase.from('habits').update(payload).eq('id', editingHabitId);
        if (!error) {
          setHabits(prev => prev.map(h => h.id === editingHabitId ? { ...h, ...payload } : h));
        } else {
          throw error;
        }
      } else {
        // Insert mode
        const { data, error } = await supabase.from('habits').insert({ ...payload, user_id: userData.user?.id }).select().single();
        if (data) {
          setHabits(prev => [...prev, data]);
        } else {
          throw error;
        }
      }
    } catch (err) {
      console.warn("DB save failed, updating mock habit:", err);
      if (editingHabitId) {
        setHabits(prev => prev.map(h => h.id === editingHabitId ? { ...h, ...newHabit, frequency: 'daily' } : h));
      } else {
        setHabits(prev => [...prev, { id: crypto.randomUUID(), ...newHabit, frequency: 'daily' }]);
      }
    }
    
    setIsAddModalOpen(false);
    setEditingHabitId(null);
    setNewHabit({ name: '', description: '', color: COLORS[0], icon: 'Activity' });
  };

  const activeHabits = habits.length;
  const completionsToday = habits.filter(h => getLogForDate(h.id, today)?.status === 'completed').length;
  const totalCompletions = logs.filter(l => l.status === 'completed').length;

  return (
    <div className="space-y-6 text-zinc-800 dark:text-zinc-100 select-none">
      
      {/* -------------------- ACTION BAR -------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#e5e5e5] dark:border-[#262626] pb-4 bg-white dark:bg-[#0d0d0d]">
        <h2 className="text-sm font-bold text-zinc-500 flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" /> Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </h2>
        <button
          onClick={() => {
            setEditingHabitId(null);
            setNewHabit({ name: '', description: '', color: COLORS[0], icon: 'Activity' });
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-2 px-4 font-bold text-white transition-colors cursor-pointer w-full sm:w-auto text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* -------------------- STATS OVERVIEW -------------------- */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{activeHabits}</span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center mt-1">Active Habits</span>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completionsToday}</span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center mt-1">Done Today</span>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalCompletions}</span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center mt-1">Total Logs</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* -------------------- DAILY CHECKLIST -------------------- */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Daily Routine</h3>
          
          <div className="space-y-3">
            {habits.map(habit => {
              const Icon = ICONS[habit.icon] || Activity;
              const todayLog = getLogForDate(habit.id, today);
              const isCompleted = todayLog?.status === 'completed';
              const isFailed = todayLog?.status === 'failed';

              return (
                <div 
                  key={habit.id}
                  onClick={() => handleToggleHabit(habit.id, today, todayLog?.status)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                    isCompleted 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50' 
                      : isFailed
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                        : 'bg-white dark:bg-[#141414] border-zinc-200 dark:border-zinc-800 hover:border-purple-500/50'
                  }`}
                >
                  {isCompleted && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -z-0" />
                  )}

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through' : isFailed ? 'text-rose-700 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {habit.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500">{habit.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingHabitId(habit.id);
                          setNewHabit({ name: habit.name, description: habit.description || '', color: habit.color, icon: habit.icon });
                          setIsAddModalOpen(true);
                        }}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isCompleted 
                          ? 'border-emerald-500 bg-emerald-500 text-white' 
                          : isFailed
                            ? 'border-rose-500 bg-rose-500 text-white'
                            : 'border-zinc-300 dark:border-zinc-700'
                      }`}>
                        {isCompleted && <Check className="h-3 w-3 font-bold" />}
                        {isFailed && <X className="h-3 w-3 font-bold" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* -------------------- HABITS CALENDAR GRID -------------------- */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                {viewMode === 'week' ? 'Weekly Grid' : 'Monthly Grid'}
              </h3>
              <div className="flex items-center gap-1 bg-zinc-50 dark:bg-[#1a1a1a] rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 ml-2">
                <button onClick={handlePrev} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 transition-colors"><ChevronLeft className="w-3 h-3" /></button>
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 min-w-[80px] text-center">
                  {viewMode === 'week' ? `Week of ${new Date(calendarDays[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : new Date(calendarDays[0]).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <button onClick={handleNext} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 transition-colors"><ChevronRight className="w-3 h-3" /></button>
              </div>
            </div>
            
            <div className="flex bg-zinc-100 dark:bg-[#1a1a1a] p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${viewMode === 'week' ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${viewMode === 'month' ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                Month
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto p-4 sm:p-6">
            <div className="w-full min-w-0 sm:min-w-max">
              
              {/* Grid Header (Dates) */}
              <div className="flex mb-4">
                <div className="w-20 sm:w-40 shrink-0" />
                <div className="flex-1 flex justify-end gap-1 sm:gap-2">
                  {calendarDays.map((date, i) => (
                    <div key={date} className="w-6 sm:w-8 shrink-0 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-zinc-400">{new Date(date).toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                      <span className={`text-[10px] mt-1 ${date === today ? 'text-purple-500 font-black' : 'text-zinc-500'}`}>
                        {new Date(date).getDate()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Rows (Habits) */}
              <div className="space-y-4">
                {habits.map(habit => (
                  <div key={habit.id} className="flex items-center">
                    <div className="w-20 sm:w-40 shrink-0 flex items-center gap-1.5 sm:gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                      <span className="text-[10px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate pr-2 sm:pr-4">{habit.name}</span>
                    </div>
                    
                    <div className="flex-1 flex justify-end gap-1 sm:gap-2">
                      {calendarDays.map((date, i) => {
                        const log = getLogForDate(habit.id, date);
                        const isCompleted = log?.status === 'completed';
                        const isFailed = log?.status === 'failed';
                        
                        return (
                          <div 
                            key={`${habit.id}-${date}`}
                            onClick={() => handleToggleHabit(habit.id, date, log?.status)}
                            className={`w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-md sm:rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                              isCompleted
                                ? 'shadow-sm border'
                                : isFailed
                                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                                  : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                            }`}
                            style={isCompleted ? { backgroundColor: `${habit.color}20`, borderColor: `${habit.color}40`, color: habit.color } : {}}
                          >
                            {isCompleted && <Check className="h-4 w-4" />}
                            {isFailed && <X className="h-4 w-4" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* -------------------- ADD HABIT MODAL -------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#141414] rounded-2xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4">{editingHabitId ? 'Edit Habit' : 'Create New Habit'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Habit Name</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="e.g. Reading, Working out"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Description (Optional)</label>
                <input
                  type="text"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({...newHabit, description: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="e.g. 20 pages a day"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Color Theme</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewHabit({...newHabit, color: c})}
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${newHabit.color === c ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(ICONS).map(iconName => {
                    const IconComp = ICONS[iconName];
                    return (
                      <button
                        key={iconName}
                        onClick={() => setNewHabit({...newHabit, icon: iconName})}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${newHabit.icon === iconName ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 border border-purple-500/50' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                      >
                        <IconComp className="h-5 w-5" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHabit}
                  disabled={!newHabit.name}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
                >
                  Save Habit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

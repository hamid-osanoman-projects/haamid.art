import React from 'react';
import { createClient } from '@/lib/supabase/server';
import HabitsTracker from '@/components/dashboard/HabitsTracker';

export default async function HabitsDashboard() {
  let habits = [];
  let habitLogs = [];

  try {
    const supabase = await createClient();

    // Query habits
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });

    if (!habitsError && habitsData) {
      habits = habitsData;
    }

    // Query last 30 days of logs
    const { data: logsData, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .gte('log_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('log_date', { ascending: false });

    if (!logsError && logsData) {
      habitLogs = logsData;
    }
  } catch (err) {
    console.warn('DB load for habits skipped, using mock fallbacks:', err);
  }

  return (
    <div className="p-4 md:p-8 space-y-6 w-full min-w-0">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Habit Tracker</h1>
        <p className="text-xs text-zinc-500">Track your daily routines, monitor your consistency, and maintain your streaks.</p>
      </div>

      <HabitsTracker initialHabits={habits} initialLogs={habitLogs} />
    </div>
  );
}

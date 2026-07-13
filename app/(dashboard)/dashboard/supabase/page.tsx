import React from 'react';
import { createClient } from '@/lib/supabase/server';
import SupabaseTracker from '@/components/dashboard/SupabaseTracker';

export default async function SupabaseConsoleDashboard() {
  let trackers = [];

  try {
    const supabase = await createClient();

    // Query tracking databases logs ordered by idle counters
    const { data, error } = await supabase
      .from('supabase_projects')
      .select('*')
      .order('days_idle', { ascending: false });

    if (!error && data) {
      trackers = data;
    }
  } catch (err) {
    console.warn('DB load in Supabase tracker skipped, using mock fallbacks:', err);
  }

  return (
    <div className="p-4 md:p-8 space-y-6 w-full min-w-0">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Supabase Manager</h1>
        <p className="text-xs text-zinc-500">Monitor free tier database projects idle counts, trigger restores, and copy scheduler scripts.</p>
      </div>

      <SupabaseTracker initialProjects={trackers} />
    </div>
  );
}

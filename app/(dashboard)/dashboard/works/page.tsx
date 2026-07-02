import React from 'react';
import { createClient } from '@/lib/supabase/server';
import WorksOverview from '@/components/dashboard/WorksOverview';

export default async function WorksOverviewPage() {
  let tasks = [];
  let recentLogs = [];

  try {
    const supabase = await createClient();
    
    const [tasksRes, logsRes] = await Promise.all([
      supabase.from('works').select('*').order('created_at', { ascending: false }),
      supabase.from('work_updates').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    if (!tasksRes.error && tasksRes.data) {
      tasks = tasksRes.data;
    }
    
    if (!logsRes.error && logsRes.data) {
      recentLogs = logsRes.data;
    }
  } catch (err) {
    console.warn('DB fetch failed on works overview:', err);
  }

  return (
    <div className="h-full">
      <WorksOverview tasks={tasks} recentLogs={recentLogs} />
    </div>
  );
}

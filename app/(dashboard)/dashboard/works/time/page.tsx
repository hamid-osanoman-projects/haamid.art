import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AllWorksList from '@/components/dashboard/AllWorksList';

export default async function TimeLogWorksPage() {
  let tasks = [];

  try {
    const supabase = await createClient();
    
    // Fetch tasks that have logged actual hours
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .gt('actual_hours', 0)
      .order('actual_hours', { ascending: false });

    if (!error && data) {
      tasks = data;
    }
  } catch (err) {
    console.warn('DB connect failed in works tracker:', err);
  }

  return (
    <div className="h-full">
      <AllWorksList 
        tasks={tasks} 
        pageTitle="Time Log" 
        pageSubtitle="Tasks sorted by actual time invested. Monitor your efficiency." 
      />
    </div>
  );
}

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AllWorksList from '@/components/dashboard/AllWorksList';

export default async function ThisWeekWorksPage() {
  let tasks = [];

  try {
    const supabase = await createClient();
    
    // Calculate week start and end
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0];
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6)).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('works')
      .select('*')
      .gte('due_date', firstDay)
      .lte('due_date', lastDay)
      .order('due_date', { ascending: true });

    if (!error && data) {
      tasks = data;
    }
  } catch (err) {
    console.warn('DB connect failed in works tracker:', err);
  }

  return (
    <div className="h-full w-full min-w-0">
      <AllWorksList 
        tasks={tasks} 
        pageTitle="This Week's Agenda" 
        pageSubtitle="Tasks and deliverables due between Sunday and Saturday of this week." 
      />
    </div>
  );
}

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AllWorksList from '@/components/dashboard/AllWorksList';

export default async function AllWorksPage() {
  let tasks = [];

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .order('due_date', { ascending: true });

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
        pageTitle="All Works Directory" 
        pageSubtitle="A complete list of every task and project across all tracks." 
      />
    </div>
  );
}

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import PersonalTracker from '@/components/dashboard/PersonalTracker';

const MOCK_PERSONAL_TASKS = [
  {
    id: 'p1',
    title: 'Design OS concept portfolio',
    description: 'Create a glassmorphic aesthetic desktop UI.',
    status: 'in_progress' as const,
    priority: 'high' as const,
    track: 'personal',
    estimated_hours: 10,
    actual_hours: 6,
    tags: ['Design', 'UI']
  }
];

export default async function PersonalWorksPage() {
  let tasks = MOCK_PERSONAL_TASKS;

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('track', 'personal')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      tasks = data;
    }
  } catch (err) {
    console.warn('DB connect failed in works tracker, using fallbacks:', err);
  }

  return (
    <div className="h-full">
      <PersonalTracker initialTasks={tasks} />
    </div>
  );
}

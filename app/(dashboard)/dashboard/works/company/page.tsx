import React from 'react';
import { createClient } from '@/lib/supabase/server';
import CompanyTracker from '@/components/dashboard/CompanyTracker';

// Static default fallback tasks if Database is empty or offline
const MOCK_COMPANY_TASKS = [
  {
    id: 'c1',
    title: 'Optimise Next.js client bundle sizes',
    description: 'Investigate heavy packages like Three.js and see if we can use dynamic wrappers with ssr: false. Target under 200kb Gzip size.',
    status: 'in_progress' as const,
    priority: 'high' as const,
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    estimated_hours: 5,
    actual_hours: 2,
    tags: ['Performance', 'Next.js']
  },
  {
    id: 'c2',
    title: 'Migrate root middleware.ts to proxy.ts convention',
    description: 'Next.js 16 deprecated middleware in favor of proxy. Move the session updater logic to proxy.ts and verify static compiles.',
    status: 'done' as const,
    priority: 'urgent' as const,
    due_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
    estimated_hours: 2,
    actual_hours: 2.5,
    tags: ['Refactoring', 'Next.js']
  },
  {
    id: 'c3',
    title: 'Setup Resend email notifications templates',
    description: 'Design HTML email templates for contact form entries and schedule confirmation notifications.',
    status: 'backlog' as const,
    priority: 'medium' as const,
    due_date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days
    estimated_hours: 6,
    actual_hours: 0,
    tags: ['Automations', 'Resend']
  },
  {
    id: 'c4',
    title: 'Review and approve visitor review submissions',
    description: 'Ensure reviewers are approved in reviews table before they render on the public testimonials carousel.',
    status: 'review' as const,
    priority: 'low' as const,
    due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // 2 days
    estimated_hours: 1,
    actual_hours: 0.5,
    tags: ['Moderation']
  }
];

export default async function CompanyWorksPage() {
  let tasks = MOCK_COMPANY_TASKS;

  try {
    const supabase = await createClient();
    
    // Fetch tasks where track = 'company'
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('track', 'company')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      tasks = data;
    }
  } catch (err) {
    console.warn('DB connect failed in works tracker, using fallbacks:', err);
  }

  return (
    <div className="h-full">
      <CompanyTracker initialTasks={tasks} />
    </div>
  );
}

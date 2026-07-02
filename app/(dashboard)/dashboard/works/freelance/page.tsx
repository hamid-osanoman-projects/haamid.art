import React from 'react';
import { createClient } from '@/lib/supabase/server';
import FreelanceTracker from '@/components/dashboard/FreelanceTracker';

// Premium mock freelance projects fallback data
const MOCK_FREELANCE_PROJECTS = [
  {
    id: 'f1',
    title: 'Corporate Website Redesign',
    description: 'Complete visual overhaul and speed optimization of Vortex Media corporate frontend using Next.js 15, Framer Motion, and Tailwind CSS v4.',
    status: 'in_progress' as const,
    priority: 'high' as const,
    due_date: new Date(Date.now() + 604800000).toISOString().split('T')[0], // 7 days
    estimated_hours: 40,
    actual_hours: 22,
    client_name: 'Sarah Jenkins',
    client_company: 'Vortex Media',
    client_email: 'sarah@vortex.com',
    budget: 450,
    currency: 'OMR'
  },
  {
    id: 'f2',
    title: 'Oman Digital Solutions Portal',
    description: 'Rebuilding client portal area with Supabase real-time databases and custom charts mapping invoice schedules.',
    status: 'review' as const,
    priority: 'medium' as const,
    due_date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    estimated_hours: 25,
    actual_hours: 26.5,
    client_name: 'Al-Farabi Al-Balushi',
    client_company: 'Oman Digital Solutions',
    client_email: 'farabi@ods.om',
    budget: 850,
    currency: 'OMR'
  },
  {
    id: 'f3',
    title: 'Mobile App Design System',
    description: 'Creating high-fidelity design layouts in Figma and converting elements to Tailwind-compliant UI tokens.',
    status: 'on_hold' as const,
    priority: 'low' as const,
    due_date: new Date(Date.now() + 1209600000).toISOString().split('T')[0], // 14 days
    estimated_hours: 15,
    actual_hours: 8,
    client_name: 'Amara Vance',
    client_company: 'Stellar Tech',
    client_email: 'amara@stellar.com',
    budget: 300,
    currency: 'OMR'
  }
];

export default async function FreelanceWorksPage() {
  let projects = MOCK_FREELANCE_PROJECTS;

  try {
    const supabase = await createClient();
    
    // Fetch freelance works and join with clients table for name/company details
    const { data, error } = await supabase
      .from('works')
      .select(`
        *,
        clients (
          name,
          email,
          company
        )
      `)
      .eq('track', 'freelance')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      projects = data.map((item: any) => ({
        ...item,
        client_name: item.clients?.name || 'N/A',
        client_company: item.clients?.company || 'N/A',
        client_email: item.clients?.email || '',
        budget: item.budget || 150, // default if missing
        currency: item.currency || 'OMR'
      }));
    }
  } catch (err) {
    console.warn('DB read failed, using premium freelance fallbacks:', err);
  }

  return (
    <div className="h-full">
      <FreelanceTracker initialProjects={projects} />
    </div>
  );
}

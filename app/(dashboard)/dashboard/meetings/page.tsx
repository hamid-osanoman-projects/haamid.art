import React from 'react';
import { createClient } from '@/lib/supabase/server';
import MeetingsManager from '@/components/dashboard/MeetingsManager';

// Static default fallback meetings if database is offline or empty
const MOCK_MEETINGS = [
  {
    id: 'mt1',
    title: 'Sprint Retrospective & Alignment',
    type: 'retro',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    duration: 30,
    status: 'upcoming' as const,
    notes: 'Review accomplishments on Next.js bundle sizing and align on feedback metrics.',
    agenda: ['Review page load speeds', 'Discuss database schemas migration', 'Determine next milestones outline'],
    client_name: 'Sarah Jenkins',
    client_id: 'cl1'
  },
  {
    id: 'mt2',
    title: 'Design Review & Milestones Checkpoint',
    type: 'review',
    scheduled_at: new Date(Date.now() + 259200000).toISOString(), // 3 days
    duration: 45,
    status: 'upcoming' as const,
    notes: 'Check Arabic translation layouts and review stripe payment gateway webhook setups.',
    agenda: ['Verify dynamic RTL stylesheet configurations', 'Test stripe test card payments flow', 'Lock project phase 2 deliverables'],
    client_name: 'Al-Farabi Al-Balushi',
    client_id: 'cl2'
  }
];

const MOCK_MEETINGS_CLIENTS = [
  { id: 'cl1', name: 'Sarah Jenkins' },
  { id: 'cl2', name: 'Al-Farabi Al-Balushi' },
  { id: 'cl3', name: 'Amara Vance' }
];

export default async function MeetingsSchedulePage() {
  let meetings = MOCK_MEETINGS;
  let clientsList = MOCK_MEETINGS_CLIENTS;

  try {
    const supabase = await createClient();
    
    // Fetch clients list for selector
    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, name')
      .order('name', { ascending: true });

    if (clientsData && clientsData.length > 0) {
      clientsList = clientsData;
    }

    // Fetch meetings
    const { data: meetingsData, error } = await supabase
      .from('meetings')
      .select(`
        *,
        clients (
          name
        )
      `)
      .order('scheduled_at', { ascending: true });

    if (!error && meetingsData && meetingsData.length > 0) {
      meetings = meetingsData.map((m: any) => ({
        ...m,
        client_name: m.clients?.name || 'N/A'
      }));
    }
  } catch (err) {
    console.warn('DB query failed in meetings scheduler, using mock fallbacks:', err);
  }

  return (
    <div className="h-full">
      <MeetingsManager initialMeetings={meetings} clients={clientsList} />
    </div>
  );
}

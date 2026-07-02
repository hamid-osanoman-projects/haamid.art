import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ClientsDirectory from '@/components/dashboard/ClientsDirectory';

// Default mockup corporate clients fallback data
const MOCK_CLIENTS = [
  {
    id: 'cl1',
    name: 'Sarah Jenkins',
    company: 'Vortex Media',
    email: 'sarah@vortex.com',
    phone: '+1 (555) 349-2049',
    country: 'USA',
    next_action: 'Send layout invoice draft',
    notes: 'Primary stakeholder for the company website redesign contract. Prefers weekly retro calls.',
    activeProjectsCount: 2,
    lastContactDate: 'Yesterday'
  },
  {
    id: 'cl2',
    name: 'Al-Farabi Al-Balushi',
    company: 'Oman Digital Solutions',
    email: 'farabi@ods.om',
    phone: '+968 9483 2938',
    country: 'Oman',
    next_action: 'Confirm API staging credentials',
    notes: 'Requires dual language layout configurations (Arabic + English). Key enterprise lead.',
    activeProjectsCount: 1,
    lastContactDate: '2 days ago'
  },
  {
    id: 'cl3',
    name: 'Amara Vance',
    company: 'Stellar Tech',
    email: 'amara@stellar.com',
    phone: '+44 7911 123456',
    country: 'UK',
    next_action: 'Schedule onboarding callback',
    notes: 'Looking to hire for a design system setup project.',
    activeProjectsCount: 0,
    lastContactDate: '5 days ago'
  }
];

export default async function ClientsCRMPage() {
  let clientsList = MOCK_CLIENTS;

  try {
    const supabase = await createClient();
    
    // Fetch clients records
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (!error && clientsData && clientsData.length > 0) {
      // Loop to fetch active project counts for each client
      const clientsWithCounts = await Promise.all(
        clientsData.map(async (client) => {
          // Query active works count
          const { count } = await supabase
            .from('works')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id)
            .eq('status', 'in_progress');

          return {
            ...client,
            activeProjectsCount: count || 0,
            lastContactDate: 'Recently'
          };
        })
      );
      clientsList = clientsWithCounts;
    }
  } catch (err) {
    console.warn('DB connect failed in clients CRM, using mock data:', err);
  }

  return (
    <div className="h-full">
      <ClientsDirectory initialClients={clientsList} />
    </div>
  );
}

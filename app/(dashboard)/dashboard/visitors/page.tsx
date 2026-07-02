import React from 'react';
import { createClient } from '@/lib/supabase/server';
import VisitorsDirectory from '@/components/dashboard/VisitorsDirectory';

export default async function VisitorsDashboard() {
  let visitors = [];

  try {
    const supabase = await createClient();

    // Query active visitors metrics ordered by last active seen times
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .order('last_seen_at', { ascending: false });

    if (!error && data) {
      visitors = data;
    }
  } catch (err) {
    console.warn('DB load of visitor metrics skipped, using structured mocks:', err);
  }

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-white tracking-tight">Visitors CRM</h1>
        <p className="text-xs text-zinc-500">Track visitor session paths, countries density, and unlocked gamification scores.</p>
      </div>

      <VisitorsDirectory initialVisitors={visitors} />
    </div>
  );
}

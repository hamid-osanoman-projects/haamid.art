import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  // Authenticate user server-side
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Set default fallback profile details
  let profile = {
    name: 'Hamid U V',
    email: user.email,
    available: true,
    avatar_url: null,
  };

  try {
    // Fetch profile details from Profiles table
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .limit(1)
      .maybeSingle();

    if (data) {
      profile = {
        ...profile,
        name: data.name || profile.name,
        available: data.available ?? true,
        avatar_url: data.avatar_url || null,
      };
    }
  } catch (err) {
    console.warn('Profiles fetch skipped, profiles table may not exist yet:', err);
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}

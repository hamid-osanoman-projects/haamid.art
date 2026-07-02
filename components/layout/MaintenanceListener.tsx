'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function MaintenanceListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('global_settings_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'global_settings' },
        (payload) => {
          // Whenever the global settings change in the database,
          // instantly force the client router to fetch the latest server components
          // and reload the window to apply the maintenance screen immediately.
          router.refresh();
          
          // Small delay to allow Next.js router to refresh before hard reloading
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}

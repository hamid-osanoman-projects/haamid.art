import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ReviewsModerator from '@/components/dashboard/ReviewsModerator';

export default async function ReviewsDashboard() {
  let reviews = [];

  try {
    const supabase = await createClient();

    // Query reviews ordered by creation date
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      reviews = data;
    }
  } catch (err) {
    console.warn('DB load in reviews directory skipped, using mock fallbacks:', err);
  }

  return (
    <div className="p-4 md:p-8 space-y-6 w-full min-w-0">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Reviews Moderation</h1>
        <p className="text-xs text-zinc-500">Audit project reviews, copy LinkedIn recommendation blocks, and export social graphics cards.</p>
      </div>

      <ReviewsModerator initialReviews={reviews} />
    </div>
  );
}

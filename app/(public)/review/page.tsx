'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import ReviewForm from '@/components/review/ReviewForm';

function ReviewIntakeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [reviewId, setReviewId] = useState('');
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Query reviews database table for token matches
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            *,
            clients (
              name,
              company
            )
          `)
          .eq('token', token)
          .maybeSingle();

        if (!error && data && data.status === 'pending') {
          // Token is valid and ready for inputs
          setReviewId(data.id);
          setClientName(data.clients?.name || '');
          setCompanyName(data.clients?.company || '');
          setIsValid(true);
        }
      } catch (err) {
        console.warn('Review token validation failed, skipping check:', err);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Validating link token...</p>
      </div>
    );
  }

  if (!token || !isValid) {
    return (
      <div className="rounded-2xl border border-rose-500/10 bg-zinc-950 p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto animate-pulse">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-black text-white">Invalid or Expired Link</h3>
        <p className="text-xs text-zinc-400 leading-relaxed font-normal">
          Testimonial magic links are single-use tokens created for client projects. If you have already submitted your review, this token will have expired.
        </p>
      </div>
    );
  }

  return (
    <ReviewForm 
      reviewId={reviewId} 
      initialName={clientName} 
      initialCompany={companyName} 
    />
  );
}

export default function ReviewPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] py-16 md:py-24 px-6 flex flex-col justify-center select-none">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Loading form viewport...</p>
        </div>
      }>
        <ReviewIntakeContent />
      </Suspense>
    </main>
  );
}

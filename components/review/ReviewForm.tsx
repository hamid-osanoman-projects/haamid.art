'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useTracker } from '@/components/gamification/TrackerProvider';

interface ReviewFormProps {
  reviewId: string;
  initialName?: string;
  initialCompany?: string;
}

export default function ReviewForm({ reviewId, initialName = '', initialCompany = '' }: ReviewFormProps) {
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState(initialCompany);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  
  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const { triggerCustomAction } = useTracker();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewId,
          reviewer_name: name,
          reviewer_role: role,
          reviewer_company: company,
          rating,
          content
        })
      });

      if (res.ok) {
        setSubmitStatus('success');
        // Award XP for submitting feedback (+25 XP)
        triggerCustomAction('contact');
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="rounded-2xl border border-purple-500/10 bg-zinc-950 p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-black text-white">Review Submitted!</h3>
        <p className="text-xs text-zinc-400 leading-relaxed font-normal">
          Thank you so much for your valuable feedback. Your review has been logged and sent to Hamid for staging moderation.
        </p>
      </div>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full max-w-lg mx-auto rounded-2xl border border-zinc-900 bg-zinc-950/30 p-8 space-y-6 shadow-2xl"
    >
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          <span>Client Review Portal</span>
        </span>
        <h2 className="text-xl font-bold text-white">Share Your Experience</h2>
        <p className="text-zinc-500 text-[11px]">Help support Hamid by leaving a rating and description of our collaboration.</p>
      </div>

      {/* Star Selector widget */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Overall Project Rating</label>
        <div className="flex gap-1.5 items-center">
          {[1, 2, 3, 4, 5].map((starVal) => {
            const isActive = rating >= starVal;
            return (
              <button
                key={starVal}
                type="button"
                onClick={() => setRating(starVal)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isActive ? 'text-amber-500 hover:text-amber-400' : 'text-zinc-700 hover:text-zinc-650'
                }`}
              >
                <Star className="h-7 w-7 fill-current" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Reviewer Meta Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-zinc-500">
        <div>
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Your Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1.5 rounded-lg border border-zinc-900 bg-zinc-950 py-2.5 px-4 text-zinc-200 outline-none focus:border-purple-500/30"
          />
        </div>

        <div>
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Your Role</label>
          <input
            type="text"
            placeholder="e.g. Lead Designer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full mt-1.5 rounded-lg border border-zinc-900 bg-zinc-950 py-2.5 px-4 text-zinc-200 outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Company Name</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full mt-1.5 rounded-lg border border-zinc-900 bg-zinc-950 py-2.5 px-4 text-zinc-200 outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Your Testimonial Review</label>
          <textarea
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your experience collaborating with Hamid..."
            className="w-full mt-1.5 rounded-lg border border-zinc-900 bg-zinc-950 p-4 text-zinc-200 outline-none focus:border-purple-500/30 resize-none"
          />
        </div>
      </div>

      {submitStatus === 'error' && (
        <div className="p-3.5 bg-rose-950/20 border border-rose-500/20 rounded-xl text-[10px] text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span className="font-semibold">Submission failed. Verify connection status.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !name || !content}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase tracking-wider py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-30 flex items-center justify-center gap-1.5"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        <span>{isSubmitting ? 'Uploading review...' : 'Submit Testimonial'}</span>
      </button>

    </form>
  );
}

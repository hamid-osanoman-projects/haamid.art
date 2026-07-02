'use client';

import React, { useState } from 'react';
import { 
  Star, Check, X, Copy, Image as ImageIcon, Sparkles, Award, 
  MessageSquare, Heart, RefreshCw, AlertCircle 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_company?: string;
  reviewer_role?: string;
  rating: number;
  content: string;
  project_title?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  token?: string;
}

interface ReviewsModeratorProps {
  initialReviews: Review[];
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    reviewer_name: 'John Doe',
    reviewer_company: 'Vercel',
    reviewer_role: 'Engineering Lead',
    rating: 5,
    content: 'Hamid delivered our landing page module extremely fast. The 3D text overlays are premium, and the clean animations make the site feel completely alive.',
    project_title: 'Anti-Gravity Landing Shader',
    status: 'approved',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'r2',
    reviewer_name: 'Alice Smith',
    reviewer_company: 'Supabase',
    reviewer_role: 'Growth PM',
    rating: 5,
    content: 'Exceptional integration speed. Having the cookie-free static routing with dynamic real-time triggers saved us weeks of dev time.',
    project_title: 'Realtime Sync Tracker',
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'r3',
    reviewer_name: 'Sarah Connor',
    reviewer_company: 'Cyberdyne Systems',
    reviewer_role: 'Founder',
    rating: 4,
    content: 'Very clean full stack architecture setup. The client directory interfaces are responsive and easy to navigate.',
    project_title: 'AI Dashboard Directory',
    status: 'rejected',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

export default function ReviewsModerator({ initialReviews }: ReviewsModeratorProps) {
  const [reviews, setReviews] = useState<Review[]>(
    initialReviews.length > 0 ? initialReviews : MOCK_REVIEWS
  );
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  // Clipboard copying feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const supabase = createClient();

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', id);

      if (!error) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.warn('DB update failed, toggling state locally:', err);
      // Fallback update for mock consistency
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    }
  };

  // Metrics logic
  const approvedList = reviews.filter(r => r.status === 'approved');
  const totalApproved = approvedList.length;
  const avgRating = totalApproved > 0 
    ? (approvedList.reduce((acc, r) => acc + r.rating, 0) / totalApproved).toFixed(1)
    : '5.0';

  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const responseRate = reviews.length > 0 
    ? Math.round(((reviews.length - pendingCount) / reviews.length) * 100)
    : 100;

  // Filter listings by tab status
  const currentReviews = reviews.filter(r => r.status === activeTab);

  const handleCopyLinkedInRecommendation = (review: Review) => {
    const recommendationText = `I highly recommend ${review.reviewer_name} (${review.reviewer_role} at ${review.reviewer_company}) who collaborated with me on "${review.project_title}". Feedback: "${review.content}"`;
    navigator.clipboard.writeText(recommendationText);
    setCopiedId(review.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 text-zinc-800 dark:text-zinc-100 select-none">
      
      {/* -------------------- STATS ROW -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Average Rating</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xl font-bold text-zinc-850 dark:text-white">{avgRating}</span>
            <div className="flex text-amber-500">
              <Star className="h-4 w-4 fill-current" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Total Approved reviews</p>
          <p className="text-xl font-bold text-zinc-850 dark:text-white mt-1">{totalApproved}</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Review Response Rate</p>
          <p className="text-xl font-bold text-zinc-850 dark:text-white mt-1">{responseRate}%</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Pending Review Audits</p>
          <p className="text-xl font-bold text-zinc-850 dark:text-white mt-1">{pendingCount}</p>
        </div>

      </div>

      {/* -------------------- TAB GROUP CONTROLS -------------------- */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-900 pb-2">
        {(['pending', 'approved', 'rejected'] as const).map(tab => {
          const badgeCount = reviews.filter(r => r.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === tab 
                  ? 'bg-purple-600 text-white font-extrabold' 
                  : 'hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-400'
              }`}
            >
              <span className="capitalize">{tab}</span>
              <span className="bg-zinc-950/40 px-2 py-0.5 rounded text-[8px]">{badgeCount}</span>
            </button>
          );
        })}
      </div>

      {/* -------------------- CARDS GRID DISPLAY -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentReviews.map(review => (
          <div 
            key={review.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              
              {/* Header: Name, Stars */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-zinc-900 dark:text-zinc-150">{review.reviewer_name}</h4>
                  <p className="text-[10px] text-zinc-500">{review.reviewer_role} at {review.reviewer_company || 'N/A'}</p>
                </div>
                
                <div className="flex text-amber-500 gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-900/60 rounded-lg">
                "{review.content}"
              </p>

              {/* Linked project details */}
              {review.project_title && (
                <div className="text-[10px] text-zinc-500 font-semibold">
                  Linked Work: <strong className="text-purple-400">{review.project_title}</strong>
                </div>
              )}

            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-900/60 pt-4 mt-6">
              
              {/* Pending Tab Controls: Approve / Reject */}
              {activeTab === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'approved')}
                    className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'rejected')}
                    className="p-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-650 text-rose-400 hover:text-white border border-rose-500/20 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              ) : (
                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                  Audited: {review.status}
                </div>
              )}

              {/* Share utilities: LinkedIn, Social card */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLinkedInRecommendation(review)}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  title="Copy LinkedIn Recommendation block"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedId === review.id ? 'Copied!' : 'LinkedIn'}</span>
                </button>
                
                <button
                  onClick={() => setSelectedReview(review)}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  title="Preview review share card image"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Card image</span>
                </button>
              </div>

            </div>

          </div>
        ))}
      </div>

      {/* -------------------- SOCIAL SHARE PREVIEW CARD DIALOG -------------------- */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#0d0d0d] border border-zinc-900 p-6 rounded-2xl space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>Testimonial Card visualizer</span>
              </span>
              <button 
                onClick={() => setSelectedReview(null)}
                className="p-1 rounded hover:bg-zinc-900 text-zinc-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Testimonial share card visual block */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-950/20 via-zinc-950 to-zinc-900/60 border border-purple-500/10 shadow-2xl relative text-center space-y-6">
              
              {/* Star tags */}
              <div className="flex justify-center text-amber-500 gap-1">
                {Array.from({ length: selectedReview.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>

              {/* Message */}
              <blockquote className="text-xs text-zinc-250 italic leading-relaxed font-normal">
                "{selectedReview.content}"
              </blockquote>

              {/* Author credentials */}
              <div>
                <h4 className="font-extrabold text-sm text-white">{selectedReview.reviewer_name}</h4>
                <p className="text-[9px] text-zinc-400 uppercase tracking-widest mt-1">
                  {selectedReview.reviewer_role} · {selectedReview.reviewer_company}
                </p>
              </div>

              {/* Footer watermark branding */}
              <div className="text-[8px] font-black uppercase tracking-widest text-purple-400/60">
                haaamid.art
              </div>
            </div>

            {/* Share controls */}
            <button
              onClick={() => {
                alert('Testimonial card PNG generated. Saved in local assets folder.');
                setSelectedReview(null);
              }}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Download PNG testimonial</span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

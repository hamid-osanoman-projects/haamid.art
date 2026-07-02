'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_company?: string;
  reviewer_role?: string;
  rating: number;
  content: string;
  project_type?: string;
}

interface ReviewCarouselProps {
  reviews: Review[];
}

const DEFAULT_REVIEWS: Review[] = [
  {
    id: '1',
    reviewer_name: 'Sarah Jenkins',
    reviewer_company: 'Vortex Media',
    reviewer_role: 'Operations Director',
    rating: 5,
    content: 'Hamid built a custom project management dashboard for us that cut our planning overhead by 40%. His attention to UX is outstanding.',
    project_type: 'Full-stack Platform'
  },
  {
    id: '2',
    reviewer_name: 'Al-Farabi Al-Balushi',
    reviewer_company: 'Oman Digital Solutions',
    reviewer_role: 'Founder',
    rating: 5,
    content: 'An absolute professional. Hamid completed our Next.js frontend rebuild ahead of schedule and with incredible precision. Highly recommended.',
    project_type: 'Web Application'
  },
  {
    id: '3',
    reviewer_name: 'David K.',
    reviewer_company: 'Flow State Dev',
    reviewer_role: 'Lead Architect',
    rating: 5,
    content: 'Excellent communication and clean codebase. The Supabase integration works seamlessly under high concurrent load. A talented full-stack engineer.',
    project_type: 'Database Migration'
  },
  {
    id: '4',
    reviewer_name: 'Amara Vance',
    reviewer_company: 'Stellar Tech',
    reviewer_role: 'Product Manager',
    rating: 5,
    content: 'Hamid brought both high-end engineering skills and creative design ideas. The micro-animations and performance of our portal are unmatched.',
    project_type: 'Creative Portfolio'
  }
];

export default function ReviewCarousel({ reviews }: ReviewCarouselProps) {
  // Use database reviews if populated, otherwise fallback to defaults
  const activeReviews = reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS;

  // Duplicate items to ensure seamless infinite looping marquee scroll
  const marqueeItems = [...activeReviews, ...activeReviews];

  return (
    <div className="relative w-full overflow-hidden py-10">
      {/* Embedded CSS for hardware-accelerated marquee */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee-scroll {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Decorative gradient overlay to fade edges */}
      <div className="absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />

      {/* Marquee Track */}
      <div className="animate-marquee-scroll gap-6">
        {marqueeItems.map((review, idx) => (
          <div
            key={`${review.id}-${idx}`}
            className="w-[350px] shrink-0 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 hover:bg-zinc-900/50 hover:shadow-lg hover:shadow-purple-500/5"
          >
            {/* Rating Stars */}
            <div className="flex gap-1 mb-4 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4.5 w-4.5 ${
                    i < review.rating ? 'fill-current' : 'text-zinc-600'
                  }`}
                />
              ))}
            </div>

            {/* Testimonial text */}
            <p className="text-zinc-300 text-sm leading-relaxed mb-6 font-medium italic">
              "{review.content}"
            </p>

            {/* Client profile */}
            <div className="border-t border-zinc-800/60 pt-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-zinc-100">{review.reviewer_name}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {review.reviewer_role}
                  {review.reviewer_company && ` at ${review.reviewer_company}`}
                </p>
              </div>
              {review.project_type && (
                <span className="text-[10px] font-semibold text-purple-400 bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {review.project_type}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

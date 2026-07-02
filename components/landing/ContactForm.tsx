'use client';

import React, { useState, useEffect } from 'react';
import { Mail, User, MessageSquare, Briefcase, Sparkles, Loader2, ArrowRight, Calendar, ExternalLink } from 'lucide-react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '', type: 'collab' });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fingerprint, setFingerprint] = useState('');

  const calUsername = process.env.NEXT_PUBLIC_CAL_USERNAME || 'haamid.art';
  const calUrl = calUsername.startsWith('http')
    ? (calUsername.includes('?') ? `${calUsername}&theme=dark` : `${calUsername}?theme=dark`)
    : `https://cal.com/${calUsername}?theme=dark`;

  // Load FingerprintJS on mount for visitor tracking association
  useEffect(() => {
    FingerprintJS.load()
      .then(fp => fp.get())
      .then(result => setFingerprint(result.visitorId))
      .catch(err => console.warn('FingerprintJS load skipped or failed:', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fingerprint }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok) {
        setStatus({ type: 'success', text: 'Message sent successfully! Hamid will reach out shortly.' });
        setForm({ name: '', email: '', message: '', type: 'collab' });
      } else {
        setStatus({ type: 'error', text: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (err) {
      setIsLoading(false);
      setStatus({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      
      {/* Contact Form Details */}
      <div className="lg:col-span-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-8 backdrop-blur-md">
          
          <div className="flex items-center gap-2 mb-2 text-purple-400">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-lg font-semibold text-zinc-100">Send a message</h3>
          </div>

          {status && (
            <div className={`p-4 rounded-xl text-sm leading-relaxed border ${
              status.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
            }`}>
              {status.text}
            </div>
          )}

          {/* Name Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Name</label>
            <div className="relative mt-2">
              <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 py-3.5 pr-4 pl-12 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200 focus:border-purple-500/50 focus:bg-zinc-900/80"
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
            <div className="relative mt-2">
              <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 py-3.5 pr-4 pl-12 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200 focus:border-purple-500/50 focus:bg-zinc-900/80"
              />
            </div>
          </div>

          {/* Inquiry Type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Subject / Project Type</label>
            <div className="relative mt-2">
              <Briefcase className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 py-3.5 pr-4 pl-12 text-sm text-zinc-300 outline-none transition-all duration-200 focus:border-purple-500/50 focus:bg-zinc-900/80 appearance-none cursor-pointer"
              >
                <option value="hire">Hire for Freelance Project</option>
                <option value="collab">Collaboration Opportunity</option>
                <option value="other">General Inquiry</option>
              </select>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Message Details</label>
            <div className="relative mt-2">
              <MessageSquare className="absolute top-4 left-4 h-5 w-5 text-zinc-500" />
              <textarea
                name="message"
                required
                rows={4}
                value={form.message}
                onChange={handleChange}
                placeholder="Tell Hamid about your project scope, timeline, and goals..."
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 py-3.5 pr-4 pl-12 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200 focus:border-purple-500/50 focus:bg-zinc-900/80"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !form.name || !form.email || !form.message}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-3.5 px-4 font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Send Message</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Cal.com Scheduling Widget */}
      <div className="lg:col-span-6 space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-8 backdrop-blur-md flex flex-col justify-between min-h-[460px]">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-emerald-400">
              <Calendar className="h-5 w-5" />
              <h3 className="text-lg font-semibold text-zinc-100">Schedule a 1-on-1 Call</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Prefer a direct discussion? Skip the email back-and-forth and lock in a video call directly on my calendar. I use Cal.com to manage bookings securely.
            </p>

            {/* Quick overview of meeting options */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Available Slots</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-zinc-300">Quick meeting</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-semibold bg-zinc-900/60 px-2.5 py-1 rounded-lg">15 Min Chat</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-sm font-medium text-zinc-300">30 min meeting</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-semibold bg-zinc-900/60 px-2.5 py-1 rounded-lg">30 Min Call</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 px-4 font-semibold text-white transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-950/20 hover:shadow-emerald-500/10"
            >
              <span>Open Calendar on Cal.com</span>
              <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
      
    </div>
  );
}

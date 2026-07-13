'use client';

import React, { useState } from 'react';
import { 
  Users, Map, Compass, Star, Eye, Calendar, Clock, 
  Search, ArrowRight, ChevronRight, X, Mail, Sparkles, Send, MapPin, Award
} from 'lucide-react';

interface Visitor {
  id: string;
  fingerprint: string;
  country: string;
  city: string;
  referrer: string;
  utm_source?: string;
  visit_count: number;
  pages_viewed: string[];
  unlocked_achievements: string[];
  xp: number;
  segment: 'lead' | 'reader' | 'lurker';
  is_subscriber: boolean;
  first_seen_at: string;
  last_seen_at: string;
  email?: string;
  commands_typed?: string[];
  easter_eggs_found?: string[];
}

interface VisitorsDirectoryProps {
  initialVisitors: Visitor[];
}

const MOCK_VISITORS: Visitor[] = [
  {
    id: 'v1',
    fingerprint: 'fp_a982b138c2089f',
    country: 'Oman',
    city: 'Muscat',
    referrer: 'LinkedIn',
    visit_count: 8,
    pages_viewed: ['/', '/blog', '/blog/rise-of-vibe-coding', '/tools', '/news'],
    unlocked_achievements: ['first_look', 'deep_diver', 'superfan'],
    xp: 420,
    segment: 'reader',
    is_subscriber: false,
    first_seen_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_seen_at: new Date(Date.now() - 1 * 3600000).toISOString()
  },
  {
    id: 'v2',
    fingerprint: 'fp_0918cbef9a221f',
    country: 'United States',
    city: 'San Francisco',
    referrer: 'GitHub',
    visit_count: 12,
    pages_viewed: ['/', '/tools', '/tools/speed-tester', '/blog/designing-antigravity-interfaces'],
    unlocked_achievements: ['first_look', 'deep_diver', 'collaborator', 'superfan'],
    xp: 680,
    segment: 'lead',
    is_subscriber: true,
    first_seen_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    last_seen_at: new Date(Date.now() - 100000).toISOString(),
    email: 'john@vercel.com'
  },
  {
    id: 'v3',
    fingerprint: 'fp_cc8912ba0911fe',
    country: 'United Kingdom',
    city: 'London',
    referrer: 'Direct',
    visit_count: 2,
    pages_viewed: ['/', '/news'],
    unlocked_achievements: ['first_look', 'subscriber'],
    xp: 110,
    segment: 'reader',
    is_subscriber: true,
    first_seen_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    last_seen_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    email: 'sarah.k@google.com'
  },
  {
    id: 'v4',
    fingerprint: 'fp_df99081bc20144',
    country: 'India',
    city: 'Bangalore',
    referrer: 'Google',
    visit_count: 1,
    pages_viewed: ['/'],
    unlocked_achievements: ['first_look'],
    xp: 5,
    segment: 'lurker',
    is_subscriber: false,
    first_seen_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    last_seen_at: new Date(Date.now() - 1 * 3600000).toISOString()
  }
];

const ACHIEVEMENT_DETAILS: Record<string, { label: string; icon: string; desc: string }> = {
  first_look: { label: 'First Look', icon: '🗺️', desc: 'Visited the portfolio page.' },
  deep_diver: { label: 'Deep Diver', icon: '🌊', desc: 'Read 3 technical blog posts.' },
  scholar: { label: 'Scholar', icon: '📚', desc: 'Read 10 technical blog posts.' },
  collaborator: { label: 'Collaborator', icon: '🤝', desc: 'Contacted Hamid for projects.' },
  superfan: { label: 'Superfan', icon: '⭐', desc: 'Visited the portal 5+ times.' },
  subscriber: { label: 'Newsletter', icon: '📧', desc: 'Subscribed to weekly dev news.' },
  early_adopter: { label: 'Early Adopter', icon: '🚀', desc: 'Checked portal within 30 days of launch.' }
};

export default function VisitorsDirectory({ initialVisitors }: VisitorsDirectoryProps) {
  const visitorsList = initialVisitors.length > 0 ? initialVisitors : MOCK_VISITORS;

  const [activeTab, setActiveTab] = useState<'all' | 'leads' | 'readers' | 'subscribers' | 'lurkers'>('all');
  const [searchVal, setSearchVal] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  // Quick reply modal states
  const [replyMessage, setReplyMessage] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);

  // Compute metrics stats
  const totalCount = visitorsList.length;
  const leadCount = visitorsList.filter(v => v.segment === 'lead').length;
  const subscriberCount = visitorsList.filter(v => v.is_subscriber).length;
  const returningCount = visitorsList.filter(v => v.visit_count > 1).length;
  const avgXp = Math.round(visitorsList.reduce((acc, v) => acc + (v.xp || 0), 0) / totalCount);

  // Filters logic
  const filteredVisitors = visitorsList.filter(v => {
    // 1. Search filter
    const matchesSearch = v.fingerprint.toLowerCase().includes(searchVal.toLowerCase()) ||
                          v.country.toLowerCase().includes(searchVal.toLowerCase()) ||
                          (v.email && v.email.toLowerCase().includes(searchVal.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Tab segment filter
    if (activeTab === 'leads') return v.segment === 'lead';
    if (activeTab === 'readers') return v.segment === 'reader';
    if (activeTab === 'subscribers') return v.is_subscriber;
    if (activeTab === 'lurkers') return v.segment === 'lurker';
    return true;
  });

  // Calculate top pages & referrers lists
  const pageHits: Record<string, number> = {};
  const referrersCount: Record<string, number> = {};
  
  visitorsList.forEach(v => {
    (v.pages_viewed || []).forEach(p => {
      pageHits[p] = (pageHits[p] || 0) + 1;
    });
    if (v.referrer) {
      referrersCount[v.referrer] = (referrersCount[v.referrer] || 0) + 1;
    }
  });

  const topPages = Object.entries(pageHits).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topReferrers = Object.entries(referrersCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const handleSendEmailReply = () => {
    if (!replyMessage.trim() || !selectedVisitor?.email) return;
    setReplySuccess(true);
    setTimeout(() => {
      setReplySuccess(false);
      setReplyMessage('');
    }, 2000);
  };

  return (
    <div className="space-y-6 text-zinc-800 dark:text-zinc-100 select-none">
      
      {/* -------------------- STATS ROW -------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Total Unique</p>
          <p className="text-xl font-bold text-zinc-850 dark:text-white mt-1">{totalCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Leads (Contacts)</p>
          <p className="text-xl font-bold text-zinc-850 dark:text-white mt-1">{leadCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Active Subscribers</p>
          <p className="text-xl font-bold text-zinc-850 dark:text-white mt-1">{subscriberCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Returning Rate</p>
          <p className="text-xl font-bold text-zinc-850 dark:text-white mt-1">{Math.round((returningCount / totalCount) * 100)}%</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Avg Visitor XP</p>
          <p className="text-xl font-bold text-zinc-850 dark:text-white mt-1">{avgXp} XP</p>
        </div>

      </div>

      {/* -------------------- INTERACTIVE SVG WORLD DENSITY GRID MAP -------------------- */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
          <Map className="h-4 w-4" />
          <span>Active Origin Regions Density</span>
        </h3>
        
        {/* Simple responsive styled outline Map of the world */}
        <div className="h-44 w-full bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-100 dark:border-zinc-900 flex items-center justify-center relative overflow-hidden">
          <svg className="w-full h-full text-zinc-200 dark:text-zinc-850" viewBox="0 0 800 400" fill="currentColor">
            {/* Outline simplified paths representing continents */}
            {/* North America */}
            <path d="M50 80h120v60H90l-40-60z" opacity="0.3" />
            {/* South America */}
            <path d="M120 180l40 100h-30z" opacity="0.3" />
            {/* Africa */}
            <path d="M380 180h60l20 80-50 40-30-120z" opacity="0.3" />
            {/* Europe */}
            <path d="M360 80h80v60h-80z" opacity="0.3" />
            {/* Asia */}
            <path d="M460 70h200v110H460z" opacity="0.3" />
            {/* Australia */}
            <path d="M620 250h60v40h-60z" opacity="0.3" />

            {/* Glowing dots representing active visitor coordinates */}
            {visitorsList.map((v, i) => {
              // Custom map coordinates mock positions matching origin country names
              let cx = 520; // Muscat / Oman (Asia default)
              let cy = 160;

              if (v.country.includes('States')) {
                cx = 120; cy = 100;
              } else if (v.country.includes('Kingdom')) {
                cx = 380; cy = 110;
              } else if (v.country.includes('India')) {
                cx = 540; cy = 180;
              }

              return (
                <g key={v.id}>
                  <circle cx={cx} cy={cy} r="10" className="text-purple-500 fill-current animate-ping opacity-25" />
                  <circle cx={cx} cy={cy} r="4" className="text-purple-400 fill-current" />
                </g>
              );
            })}
          </svg>

          {/* Absolute floating legend overlay */}
          <div className="absolute bottom-3 left-3 bg-zinc-950 p-2 border border-zinc-900 rounded-lg flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Live Activity node</span>
          </div>
        </div>
      </div>

      {/* -------------------- SIDEBAR METRICS & VISITOR TABLE -------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Table & Filtering: Col span 8 */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filtering Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-950/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-900">
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'leads', 'readers', 'subscribers', 'lurkers'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-purple-600 text-white' 
                      : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-44">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-1.5 pl-8 pr-3 text-[10px] text-zinc-200 outline-none"
              />
            </div>
          </div>

          {/* Directory Listings Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse hidden md:table">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-900 text-zinc-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">Visitor IP Token</th>
                  <th className="py-3 px-4">Origin Location</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4">Engagement XP</th>
                  <th className="py-3 px-4">Last Seen</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-600 dark:text-zinc-300">
                {filteredVisitors.map(v => (
                  <tr 
                    key={v.id} 
                    onClick={() => setSelectedVisitor(v)}
                    className="hover:bg-zinc-100 dark:hover:bg-zinc-900/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-[10px] text-zinc-400">
                      {v.fingerprint.slice(0, 12)}...
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                      {v.city}, {v.country}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        v.segment === 'lead'
                          ? 'bg-purple-950/20 text-purple-400 border border-purple-500/10'
                          : v.segment === 'reader'
                            ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/10'
                            : 'bg-zinc-950/20 text-zinc-400 border border-zinc-900'
                      }`}>
                        {v.segment}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-800 dark:text-zinc-150">
                      {v.xp} XP
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      {new Date(v.last_seen_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <ChevronRight className="h-4 w-4 text-zinc-500 inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-zinc-200 dark:divide-zinc-900">
              {filteredVisitors.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => setSelectedVisitor(v)}
                  className="p-4 flex flex-col gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="font-mono text-[10px] text-zinc-500 font-bold">
                      {v.fingerprint.slice(0, 16)}...
                    </div>
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      v.segment === 'lead'
                        ? 'bg-purple-950/20 text-purple-400 border border-purple-500/10'
                        : v.segment === 'reader'
                          ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/10'
                          : 'bg-zinc-950/20 text-zinc-400 border border-zinc-900'
                    }`}>
                      {v.segment}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">
                      {v.city}, {v.country}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-1 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div className="text-[10px] font-bold text-zinc-500">
                      <span className="text-zinc-400 font-normal">Last:</span> {new Date(v.last_seen_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="font-semibold text-zinc-800 dark:text-zinc-150 text-xs">
                      {v.xp} XP
                    </div>
                  </div>
                </div>
              ))}
              {filteredVisitors.length === 0 && (
                <div className="p-8 text-center text-zinc-500 text-xs font-bold">
                  No visitors found.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Sidebar: Top stats widgets. Col span 4 */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Top Visited Pages */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
              Top Visited Targets
            </h3>
            
            <div className="space-y-3">
              {topPages.map(([page, hits]) => (
                <div key={page} className="flex justify-between items-center text-xs">
                  <span className="font-mono text-zinc-400 text-[10px] truncate max-w-44">{page}</span>
                  <span className="bg-zinc-900 text-zinc-400 border border-zinc-855 px-2 py-0.5 rounded text-[10px] font-bold">
                    {hits} view{hits > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
              Top Traffic Referrers
            </h3>
            
            <div className="space-y-3">
              {topReferrers.map(([ref, hits]) => (
                <div key={ref} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-300">{ref}</span>
                  <span className="bg-purple-950/20 text-purple-400 border border-purple-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                    {hits} visit{hits > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* -------------------- DETAIL DRILL-DOWN SHEET MODAL -------------------- */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end animate-fade-in">
          <div className="w-full max-w-lg h-full bg-[#0d0d0d] border-l border-zinc-900 p-6 flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-purple-950/20 text-purple-400 border border-purple-500/10 rounded">
                    {selectedVisitor.segment} visitor
                  </span>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedVisitor.fingerprint.slice(0, 18)}...</h3>
                </div>
                
                <button 
                  onClick={() => setSelectedVisitor(null)}
                  className="p-1 rounded hover:bg-zinc-900 text-zinc-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Geographic Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Origin Location</span>
                  <p className="font-semibold text-white mt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-purple-400" />
                    <span>{selectedVisitor.city}, {selectedVisitor.country}</span>
                  </p>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Traffic Referrer</span>
                  <p className="font-semibold text-white mt-1 flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-purple-400" />
                    <span>{selectedVisitor.referrer}</span>
                  </p>
                </div>
              </div>

              {/* Gamification Progress */}
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Total accrued score</span>
                  <span className="font-bold text-purple-400">{selectedVisitor.xp} XP points</span>
                </div>

                {/* Badges cloud */}
                <div className="space-y-2">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Unlocked Achievements ({selectedVisitor.unlocked_achievements?.length || 0})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVisitor.unlocked_achievements?.map(achKey => {
                      const details = ACHIEVEMENT_DETAILS[achKey];
                      return (
                        <span key={achKey} className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-zinc-900 text-zinc-200 border border-zinc-800 px-2 py-0.5 rounded">
                          <span>{details?.icon}</span>
                          <span>{details?.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Secret Easter Eggs cloud */}
                <div className="space-y-2 pt-2 border-t border-zinc-900">
                  <span className="text-[9px] text-emerald-500 font-bold uppercase block tracking-wider">Discovered Easter Eggs ({selectedVisitor.easter_eggs_found?.length || 0})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVisitor.easter_eggs_found?.length ? (
                      selectedVisitor.easter_eggs_found.map((egg, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {egg}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-600">No easter eggs discovered yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Commands typed history */}
              <div className="space-y-2">
                <span className="text-[9px] text-amber-500 font-bold uppercase block tracking-wider">Shell Commands Typed</span>
                <div className="bg-black border border-zinc-900 rounded-xl overflow-hidden p-3 min-h-[60px] font-mono text-[10px] text-zinc-400">
                  {selectedVisitor.commands_typed?.length ? (
                    selectedVisitor.commands_typed.map((cmd, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-amber-500/50">~</span>
                        <span className="text-zinc-300">{cmd}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-zinc-600 italic">No terminal commands typed.</span>
                  )}
                </div>
              </div>

              {/* Pages view count log */}
              <div className="space-y-2">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Visits Page history</span>
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl divide-y divide-zinc-900 overflow-hidden">
                  {selectedVisitor.pages_viewed?.map((page, i) => (
                    <div key={i} className="p-3 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                      <span>{page}</span>
                      <span className="text-zinc-600">Visited</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Contact Reply Drawer */}
              {selectedVisitor.email && (
                <div className="p-4 bg-purple-950/5 border border-purple-500/10 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-black uppercase tracking-wider">
                    <Mail className="h-4 w-4" />
                    <span>Quick Email Reply to: {selectedVisitor.email}</span>
                  </div>
                  
                  {replySuccess ? (
                    <p className="text-[10px] text-emerald-400 font-bold">Email dispatched successfully!</p>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Write message reply details here..."
                        className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-[10px] text-zinc-200 outline-none resize-none h-20"
                      />
                      <button
                        onClick={handleSendEmailReply}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-[9px] uppercase tracking-wider py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Send className="h-3 w-3" />
                        <span>Send Response</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="mt-8 pt-4 border-t border-zinc-900 text-center text-[10px] text-zinc-600 font-semibold">
              First seen: {new Date(selectedVisitor.first_seen_at).toLocaleDateString()}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Grid, Briefcase, Users, Calendar, Pencil, Database, 
  BarChart2, Star, Settings, LogOut, Menu, X, Bell, Plus, ShieldCheck, Radio, Wallet, Activity, ChevronDown, ChevronRight
} from 'lucide-react';
import QuickAddModal from '@/components/dashboard/works/QuickAddModal';

interface Profile {
  name: string;
  email?: string;
  available: boolean;
  avatar_url: string | null;
}

interface DashboardShellProps {
  children: React.ReactNode;
  profile: Profile;
}

const NAV_ITEMS = [
  { label: 'Overview', path: '/dashboard', icon: Grid },
  { label: 'Works', path: '/dashboard/works', icon: Briefcase },
  { label: 'Clients', path: '/dashboard/clients', icon: Users },
  { label: 'Meetings', path: '/dashboard/meetings', icon: Calendar },
  { label: 'Blog', path: '/dashboard/blog', icon: Pencil },
  { label: 'Supabase', path: '/dashboard/supabase', icon: Database },
  { label: 'Finance Tracker', path: '/dashboard/finance', icon: Wallet },
  { label: 'Habits Tracker', path: '/dashboard/habits', icon: Activity },
  { label: 'Visitors', path: '/dashboard/visitors', icon: BarChart2 },
  { label: 'Reviews', path: '/dashboard/reviews', icon: Star },
  { label: 'Secure Drop', path: '/dashboard/drop', icon: ShieldCheck },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
];

const WORKS_SUB_ITEMS = [
  { label: 'Overview', path: '/dashboard/works' },
  { label: 'Company', path: '/dashboard/works/company' },
  { label: 'Freelance', path: '/dashboard/works/freelance' },
  { label: 'Personal', path: '/dashboard/works/personal' },
  { label: 'All works', path: '/dashboard/works/all' },
  { label: 'This week', path: '/dashboard/works/week' },
  { label: 'Time log', path: '/dashboard/works/time' }
];

export default function DashboardShell({ children, profile }: DashboardShellProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(profile.available);
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Mock notifications
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [counts, setCounts] = useState({ company: 0, freelance: 0, personal: 0 });
  const [isWorksExpanded, setIsWorksExpanded] = useState(pathname.startsWith('/dashboard/works'));

  const supabase = createClient();

  async function fetchCounts() {
    try {
      const { data } = await supabase
        .from('works')
        .select('track, status')
        .eq('status', 'in_progress');
      if (data) {
        const company = data.filter((d: any) => d.track === 'company').length;
        const freelance = data.filter((d: any) => d.track === 'freelance').length;
        const personal = data.filter((d: any) => d.track === 'personal').length;
        setCounts({ company, freelance, personal });
      }
    } catch (err) {
      console.error('Failed to fetch sidebar counts:', err);
    }
  }

  // Close sidebar drawer on route navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Fetch counts on mount/navigation, and register custom works-updated event listener
  useEffect(() => {
    fetchCounts();
    window.addEventListener('works-updated', fetchCounts);
    return () => window.removeEventListener('works-updated', fetchCounts);
  }, [pathname]);

  // Global Quick Add Shortcut 'N' listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.hasAttribute('contenteditable'))
      ) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsQuickAddOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync availability state toggles to Supabase DB profiles table
  const handleAvailabilityToggle = async () => {
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    setIsSavingAvailability(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ available: nextVal })
          .eq('id', user.id);
        
        if (error) {
          console.error('Failed to update availability in DB:', error);
          // Rollback state if query fails
          setIsAvailable(isAvailable);
        }
      }
    } catch (err) {
      console.error('Availability toggle error:', err);
      setIsAvailable(isAvailable);
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Map router paths to user-friendly dashboard screen headers
  const getHeaderTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname === '/dashboard/works') return 'Works Management';
    if (pathname === '/dashboard/works/company') return 'Company Task Tracker';
    if (pathname === '/dashboard/works/freelance') return 'Freelance Project Tracker';
    if (pathname === '/dashboard/clients') return 'Client Directory';
    if (pathname === '/dashboard/meetings') return 'Meetings & Appointments';
    if (pathname === '/dashboard/blog') return 'Blog Management';
    if (pathname.startsWith('/dashboard/blog/')) return 'MDX Blog Editor';
    if (pathname === '/dashboard/supabase') return 'Supabase Projects';
    if (pathname === '/dashboard/finance') return 'Finance Tracking';
    if (pathname === '/dashboard/habits') return 'Habit Tracker';
    if (pathname === '/dashboard/visitors') return 'Visitor Analytics';
    if (pathname === '/dashboard/reviews') return 'Reviews Moderation';
    if (pathname === '/dashboard/drop') return 'Secure File Drop';
    if (pathname === '/dashboard/settings') return 'Settings & Profiles';
    if (pathname === '/vibe/lobby') return 'Vibe Lobby';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fafafa] dark:bg-[#0d0d0d] font-sans text-[#0a0a0a] dark:text-[#f5f5f5] transition-colors duration-200">
      
      {/* -------------------- SIDEBAR (Desktop) -------------------- */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#141414] p-4 select-none">
        {/* Branding header */}
        <div className="flex items-center gap-2 px-2 py-3 border-b border-[#e5e5e5] dark:border-[#262626] mb-6">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-950/20 text-xs font-bold text-purple-400">
            H
          </div>
          <span className="text-sm font-extrabold tracking-wide">
            haaamid.art
          </span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isWorks = item.path === '/dashboard/works';
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path) && !isWorks);
            return (
              <div key={item.path} className="space-y-1">
                <div className="flex items-center group relative">
                  <Link
                    href={item.path}
                    className={`flex-1 flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                      isActive || (isWorks && pathname.startsWith('/dashboard/works'))
                        ? 'bg-purple-950/10 text-purple-600 dark:text-purple-400 dark:bg-purple-950/20'
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-[#1a1a1a] dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                  {isWorks && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsWorksExpanded(!isWorksExpanded);
                      }}
                      className="absolute right-2 p-1 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {isWorksExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                {isWorks && isWorksExpanded && (
                  <div className="pl-6 border-l border-zinc-200 dark:border-zinc-800 ml-5 space-y-1 mt-1 pb-1">
                    {WORKS_SUB_ITEMS.map((sub) => {
                      const isSubActive = pathname === sub.path;
                      let badge = '';
                      if (sub.label === 'Company' && counts.company > 0) {
                        badge = ` (${counts.company})`;
                      } else if (sub.label === 'Freelance' && counts.freelance > 0) {
                        badge = ` (${counts.freelance})`;
                      } else if (sub.label === 'Personal' && counts.personal > 0) {
                        badge = ` (${counts.personal})`;
                      }

                      return (
                        <Link
                          key={sub.path}
                          href={sub.path}
                          className={`block py-1 text-[11px] font-semibold transition-all ${
                            isSubActive
                              ? 'text-purple-650 dark:text-purple-400'
                              : 'text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250'
                          }`}
                        >
                          {sub.label}{badge}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 pb-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-650 block px-3">Vibe System</span>
          </div>

          <Link
            href="/vibe/lobby"
            className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              pathname === '/vibe/lobby'
                ? 'bg-purple-950/10 text-purple-600 dark:text-purple-400 dark:bg-purple-950/20'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-[#1a1a1a] dark:hover:text-zinc-200'
            }`}
          >
            <Radio className="h-4 w-4 shrink-0" />
            <span>Vibe Lobby</span>
          </Link>
        </nav>

        {/* Sidebar Profile & Sign out */}
        <div className="border-t border-[#e5e5e5] dark:border-[#262626] pt-4 mt-auto">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="h-8 w-8 rounded-full border border-purple-500/20 bg-purple-950/30 flex items-center justify-center text-xs font-bold text-purple-400 uppercase">
              {profile.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{profile.name}</h4>
              <p className="text-[10px] text-zinc-500 truncate">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* -------------------- SIDEBAR (Mobile Drawer) -------------------- */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Black backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Sidebar Drawer container */}
          <aside className="relative flex flex-col w-[220px] h-full bg-white dark:bg-[#141414] border-r border-[#e5e5e5] dark:border-[#262626] p-4 shadow-2xl z-10 select-none animate-slide-in">
            <div className="flex items-center justify-between px-2 py-3 border-b border-[#e5e5e5] dark:border-[#262626] mb-6">
              <span className="text-sm font-extrabold tracking-wide">haaamid.art</span>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isWorks = item.path === '/dashboard/works';
                const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path) && !isWorks);
                return (
                  <div key={item.path} className="space-y-1">
                    <Link
                      href={item.path}
                      className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                        isActive || (isWorks && pathname.startsWith('/dashboard/works'))
                          ? 'bg-purple-950/10 text-purple-650 dark:text-purple-400 dark:bg-purple-950/20'
                          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-[#1a1a1a] dark:hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>

                    {isWorks && (
                      <div className="pl-6 border-l border-zinc-200 dark:border-zinc-800 ml-5 space-y-1 mt-1 pb-1">
                        {WORKS_SUB_ITEMS.map((sub) => {
                          const isSubActive = pathname === sub.path;
                          let badge = '';
                          if (sub.label === 'Company' && counts.company > 0) {
                            badge = ` (${counts.company})`;
                          } else if (sub.label === 'Freelance' && counts.freelance > 0) {
                            badge = ` (${counts.freelance})`;
                          } else if (sub.label === 'Personal' && counts.personal > 0) {
                            badge = ` (${counts.personal})`;
                          }

                          return (
                            <Link
                              key={sub.path}
                              href={sub.path}
                              onClick={() => setIsMobileOpen(false)}
                              className={`block py-1 text-[11px] font-semibold transition-all ${
                                isSubActive
                                  ? 'text-purple-650 dark:text-purple-400'
                                  : 'text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250'
                              }`}
                            >
                              {sub.label}{badge}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-4 pb-1">
                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-650 block px-3">Vibe System</span>
              </div>

              <Link
                href="/vibe/lobby"
                className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  pathname === '/vibe/lobby'
                    ? 'bg-purple-950/10 text-purple-600 dark:text-purple-400 dark:bg-purple-950/20'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-[#1a1a1a] dark:hover:text-zinc-200'
                }`}
              >
                <Radio className="h-4 w-4 shrink-0" />
                <span>Vibe Lobby</span>
              </Link>
            </nav>

            <div className="border-t border-[#e5e5e5] dark:border-[#262626] pt-4 mt-auto">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="h-8 w-8 rounded-full border border-purple-500/20 bg-purple-950/30 flex items-center justify-center text-xs font-bold text-purple-400 uppercase">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{profile.name}</h4>
                  <p className="text-[10px] text-zinc-500 truncate">{profile.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* -------------------- MAIN WORKSPACE CONTENT -------------------- */}
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Header Topbar */}
        <header className="flex h-14 items-center justify-between border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#141414] px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar open button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
              {getHeaderTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Availability slider toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider hidden sm:inline">
                {isAvailable ? 'Available' : 'Booked'}
              </span>
              <button
                onClick={handleAvailabilityToggle}
                disabled={isSavingAvailability}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                  isAvailable ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                } cursor-pointer disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isAvailable ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notification badge */}
            <button className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] text-zinc-500 dark:text-zinc-400 cursor-pointer">
              <Bell className="h-4.5 w-4.5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-purple-500" />
              )}
            </button>

            {/* Admin Verification Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/10 bg-purple-950/20 px-3 py-1 text-[10px] font-bold text-purple-400 select-none">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Hamid OS</span>
            </div>
          </div>
        </header>

        {/* Screen Content Scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full min-w-0">
          {children}
        </main>
      </div>

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

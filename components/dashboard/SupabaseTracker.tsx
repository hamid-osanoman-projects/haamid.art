'use client';

import React, { useState } from 'react';
import { 
  Database, Plus, Trash2, RefreshCw, AlertCircle, Copy, Check, 
  HelpCircle, Settings, ArrowRight, ShieldAlert, Sparkles, Terminal, X 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SupabaseProject {
  id: string;
  name: string;
  org: string;
  project_ref: string;
  status: 'active' | 'paused' | 'expiring';
  days_idle: number;
  updated_at?: string;
}

interface SupabaseTrackerProps {
  initialProjects: SupabaseProject[];
}

const MOCK_PROJECTS: SupabaseProject[] = [
  {
    id: 'sp1',
    name: 'haaamid-portfolio',
    org: 'haaamid',
    project_ref: 'agref922b',
    status: 'active',
    days_idle: 2
  },
  {
    id: 'sp2',
    name: 'realtime-chat-engine',
    org: 'hamid-labs',
    project_ref: 'chatref91a',
    status: 'paused',
    days_idle: 7
  },
  {
    id: 'sp3',
    name: 'muscat-leads-crm',
    org: 'freelance-muscat',
    project_ref: 'crmref01x',
    status: 'expiring',
    days_idle: 5
  }
];

const GITHUB_YAML_TEMPLATE = `name: Supabase Auto-Resume
on:
  schedule:
    - cron: '0 5 */5 * *'   # Every 5 days at 5am UTC
  workflow_dispatch:

jobs:
  resume:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install @supabase/supabase-js
      - name: Resume all paused Supabase projects
        env:
          SUPABASE_ACCESS_TOKEN: \${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: \${{ secrets.SUPABASE_SERVICE_KEY }}
          RESEND_API_KEY: \${{ secrets.RESEND_API_KEY }}
        run: node scripts/supabase-resume.js`;

export default function SupabaseTracker({ initialProjects }: SupabaseTrackerProps) {
  const [projects, setProjects] = useState<SupabaseProject[]>(
    initialProjects.length > 0 ? initialProjects : MOCK_PROJECTS
  );

  // Modals & instructions states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedInstructions, setCopiedInstructions] = useState(false);

  // Add form fields
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [projectRef, setProjectRef] = useState('');
  const [status, setStatus] = useState<SupabaseProject['status']>('active');
  const [daysIdle, setDaysIdle] = useState(0);

  // Resume status loading spinners indicator
  const [resumingId, setResumingId] = useState<string | null>(null);

  const supabase = createClient();

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !org || !projectRef) return;

    const newProject = {
      name,
      org,
      project_ref: projectRef,
      status,
      days_idle: Number(daysIdle)
    };

    try {
      const { data, error } = await supabase
        .from('supabase_projects')
        .insert(newProject)
        .select()
        .single();

      if (!error && data) {
        setProjects(prev => [...prev, data]);
      } else {
        // Fallback update for mock consistency
        setProjects(prev => [...prev, { ...newProject, id: Math.random().toString() }]);
      }
    } catch (err) {
      console.warn('DB write failed, inserting project locally:', err);
      setProjects(prev => [...prev, { ...newProject, id: Math.random().toString() }]);
    }

    // Reset fields
    setName('');
    setOrg('');
    setProjectRef('');
    setStatus('active');
    setDaysIdle(0);
    setShowAddModal(false);
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('supabase_projects')
        .delete()
        .eq('id', id);

      if (!error) {
        setProjects(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.warn('DB delete failed, updating local state:', err);
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleResumeProject = async (project: SupabaseProject) => {
    setResumingId(project.id);

    try {
      // Trigger RESTORE post request directly or simulate status active update
      const { error } = await supabase
        .from('supabase_projects')
        .update({ status: 'active', days_idle: 0, updated_at: new Date().toISOString() })
        .eq('id', project.id);

      if (!error) {
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'active', days_idle: 0 } : p));
      }
    } catch (err) {
      console.warn('DB update failed, restoring local instance state:', err);
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'active', days_idle: 0 } : p));
    } finally {
      setTimeout(() => setResumingId(null), 800);
    }
  };

  // Stats summaries
  const totalCount = projects.length;
  const activeCount = projects.filter(p => p.status === 'active').length;
  const pausedCount = projects.filter(p => p.status === 'paused').length;
  const expiringCount = projects.filter(p => p.status === 'expiring' || (7 - p.days_idle <= 2)).length;

  const handleCopyInstructions = () => {
    navigator.clipboard.writeText(GITHUB_YAML_TEMPLATE);
    setCopiedInstructions(true);
    setTimeout(() => setCopiedInstructions(false), 2000);
  };

  return (
    <div className="space-y-6 text-zinc-800 dark:text-zinc-100 select-none">
      
      {/* -------------------- STATS ROW -------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Total Trackers</p>
          <p className="text-xl font-bold text-zinc-850 dark:text-white mt-1">{totalCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Active Instances</p>
          <p className="text-xl font-bold text-emerald-500 mt-1">{activeCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Paused Projects</p>
          <p className="text-xl font-bold text-zinc-400 mt-1">{pausedCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#141414] text-xs font-semibold text-zinc-500">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">Expiring Soon (&lt; 2d)</p>
          <p className="text-xl font-bold text-rose-500 mt-1">{expiringCount}</p>
        </div>

      </div>

      {/* -------------------- HEAD ACTION TOGGLES -------------------- */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-4">
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
          <Database className="h-4.5 w-4.5 text-purple-400 animate-pulse" />
          <span>Supabase RESTORE Console</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Set up auto-resume</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[9px] uppercase tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* -------------------- GITHUB AUTO-RESUME YAML ACCORDION -------------------- */}
      {showInstructions && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 p-5 space-y-4 animate-slide-in">
          <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Cron Auto-Resume Instruction workflows</span>
            </span>
            
            <button
              onClick={handleCopyInstructions}
              className="py-1 px-2.5 rounded border border-zinc-900 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 hover:text-white cursor-pointer"
            >
              {copiedInstructions ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedInstructions ? 'Copied' : 'Copy YAML'}</span>
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-normal">
            To prevent your free Supabase projects from pausing due to inactivity, paste this file inside your GitHub repository under <code>.github/workflows/supabase-resume.yml</code>:
          </p>

          <pre className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl overflow-x-auto font-mono text-[9px] text-purple-400 leading-relaxed max-h-56">
            {GITHUB_YAML_TEMPLATE}
          </pre>
        </div>
      )}

      {/* -------------------- PROJECTS CARDS GRID -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map(p => {
          const daysLeft = 7 - p.days_idle;
          
          // Color coding for days left: green > 4d, amber 2-4d, red < 2d
          const colorCode = daysLeft > 4 
            ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' 
            : daysLeft >= 2 
              ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' 
              : 'text-rose-500 border-rose-500/20 bg-rose-500/5';

          return (
            <div 
              key={p.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-5 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3.5">
                
                {/* Header: Project Name & Trash */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100">{p.name}</h3>
                    <p className="text-[10px] text-zinc-500">Org: {p.org}</p>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Status badge & Ref */}
                <div className="flex gap-2 items-center">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    p.status === 'active' 
                      ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/10'
                      : p.status === 'paused'
                        ? 'bg-zinc-950/30 text-zinc-400 border border-zinc-900'
                        : 'bg-rose-950/20 text-rose-400 border border-rose-500/10'
                  }`}>
                    {p.status}
                  </span>
                  <span className="font-mono text-[9px] text-zinc-500">ref: {p.project_ref}</span>
                </div>

                {/* Expiry count box */}
                <div className={`rounded-lg border p-3 flex justify-between items-center ${colorCode}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider">
                    <p className="opacity-60 font-semibold text-[8px]">Inactivity state</p>
                    <p className="text-xs mt-0.5">{p.days_idle} days idle</p>
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-right">
                    <p className="opacity-60 font-semibold text-[8px]">Expiry countdown</p>
                    <p className="text-xs mt-0.5">{daysLeft > 0 ? `${daysLeft} days left` : 'Expired/Paused'}</p>
                  </div>
                </div>

              </div>

              {/* Console resume button */}
              <button
                onClick={() => handleResumeProject(p)}
                disabled={resumingId === p.id}
                className="w-full bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-900 text-zinc-800 dark:text-zinc-300 font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-purple-400 ${resumingId === p.id ? 'animate-spin' : ''}`} />
                <span>{resumingId === p.id ? 'Restoring ref...' : 'Resume Project'}</span>
              </button>

            </div>
          );
        })}
      </div>

      {/* -------------------- ADD PROJECT INTAKE DIALOG MODAL -------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form 
            onSubmit={handleAddProject}
            className="w-full max-w-md bg-[#0d0d0d] border border-zinc-900 p-6 rounded-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Database className="h-4.5 w-4.5" />
                <span>Register Database project</span>
              </span>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded hover:bg-zinc-900 text-zinc-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-500">
              <div className="col-span-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. leads-crm"
                  className="w-full mt-1 rounded-lg border border-zinc-900 bg-zinc-950 py-2 px-3 text-zinc-200 outline-none focus:border-purple-500/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Organization</label>
                <input
                  type="text"
                  required
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="e.g. labs"
                  className="w-full mt-1 rounded-lg border border-zinc-900 bg-zinc-950 py-2 px-3 text-zinc-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Project Ref Code</label>
                <input
                  type="text"
                  required
                  value={projectRef}
                  onChange={(e) => setProjectRef(e.target.value)}
                  placeholder="e.g. agref92"
                  className="w-full mt-1 rounded-lg border border-zinc-900 bg-zinc-950 py-2 px-3 text-zinc-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SupabaseProject['status'])}
                  className="w-full mt-1 rounded-lg border border-zinc-900 bg-zinc-950 py-2 px-3 text-zinc-350 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="expiring">Expiring</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Days Idle</label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={daysIdle}
                  onChange={(e) => setDaysIdle(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-zinc-900 bg-zinc-950 py-2 px-3 text-zinc-200 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Add Project Tracker
            </button>

          </form>
        </div>
      )}

    </div>
  );
}

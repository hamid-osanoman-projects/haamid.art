'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Briefcase, Calendar, DollarSign, ListTodo, Plus, CheckSquare, Square, 
  Trash2, Mail, Clock, ShieldAlert, Sparkles, X, Eye, FileText, Send, ChevronRight 
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done' | 'on_hold'; // maps to Lead/Proposal/Active/Complete/On Hold
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  notes?: string;
  client_id?: string;
  // extra fields for CRM
  client_name?: string;
  client_email?: string;
  client_company?: string;
  budget?: number;
  currency?: string;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string;
}

interface TimeLog {
  id: string;
  date: string;
  hours: number;
  note: string;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'unpaid' | 'paid' | 'overdue';
  due_date: string;
}

interface FreelanceTrackerProps {
  initialProjects: Project[];
}

const PIPELINE_STATUSES: { value: Project['status']; label: string }[] = [
  { value: 'backlog', label: 'Lead' },
  { value: 'on_hold', label: 'Proposal' },
  { value: 'in_progress', label: 'Active' },
  { value: 'review', label: 'Complete' },
  { value: 'done', label: 'Archived' }
];

export default function FreelanceTracker({ initialProjects }: FreelanceTrackerProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Sub-data states associated with the active selected project
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Quick adds inputs states
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [logHoursVal, setLogHoursVal] = useState('');
  const [logHoursNote, setLogHoursNote] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDueDate, setInvDueDate] = useState('');

  // Email status feedback
  const [reviewStatus, setReviewStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sendingReview, setSendingReview] = useState(false);

  const supabase = createClient();

  // Load associated mock data sub-lists when project drawer opens
  const openProjectDrawer = (project: Project) => {
    setSelectedProject(project);
    setReviewStatus(null);

    // Initial mock sub-tables associations
    setMilestones([
      { id: 'm1', title: 'Complete Wireframes', completed: true, due_date: '2026-06-10' },
      { id: 'm2', title: 'Setup Database Schemas', completed: false, due_date: '2026-06-20' },
      { id: 'm3', title: 'API Integrations & Tests', completed: false, due_date: '2026-06-30' }
    ]);

    setTimeLogs([
      { id: 't1', date: '2026-06-25', hours: 4, note: 'Implemented layout header menus' },
      { id: 't2', date: '2026-06-26', hours: 3.5, note: 'Connected Supabase middleware auth' }
    ]);

    setInvoices([
      { id: 'i1', amount: 250, currency: 'OMR', status: 'paid', due_date: '2026-06-15' },
      { id: 'i2', amount: 200, currency: 'OMR', status: 'unpaid', due_date: '2026-07-10' }
    ]);
  };

  const handleUpdateProjectField = async (fields: Partial<Project>) => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, ...fields };
    setSelectedProject(updated);
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updated : p));

    try {
      await supabase.from('works').update(fields).eq('id', selectedProject.id);
    } catch (err) {
      console.error('Project details sync failed:', err);
    }
  };

  // Milestones manipulation
  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const addMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    const newM: Milestone = {
      id: Math.random().toString(),
      title: newMilestoneTitle,
      completed: false,
      due_date: newMilestoneDate || undefined
    };
    setMilestones(prev => [...prev, newM]);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  };

  // Time logging manipulation
  const addTimeLog = () => {
    const hrs = parseFloat(logHoursVal);
    if (isNaN(hrs) || hrs <= 0) return;

    const newLog: TimeLog = {
      id: Math.random().toString(),
      date: new Date().toISOString().split('T')[0],
      hours: hrs,
      note: logHoursNote || 'Log hours entry'
    };

    setTimeLogs(prev => [...prev, newLog]);
    
    // Update actual hours in project summary
    const currentActual = selectedProject?.actual_hours || 0;
    handleUpdateProjectField({ actual_hours: currentActual + hrs });

    setLogHoursVal('');
    setLogHoursNote('');
  };

  // Invoice creation manipulation
  const createInvoice = () => {
    const amt = parseFloat(invAmount);
    if (isNaN(amt) || amt <= 0 || !invDueDate) return;

    const newInv: Invoice = {
      id: Math.random().toString(),
      amount: amt,
      currency: selectedProject?.currency || 'OMR',
      status: 'unpaid',
      due_date: invDueDate
    };

    setInvoices(prev => [...prev, newInv]);
    setInvAmount('');
    setInvDueDate('');
  };

  // Resend review dispatch email simulation
  const sendReviewRequest = async () => {
    if (!selectedProject || !selectedProject.client_email) return;
    setSendingReview(true);
    setReviewStatus(null);

    try {
      // Dispatch requests to route or API
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedProject.client_email,
          clientName: selectedProject.client_name,
          projectTitle: selectedProject.title,
          workId: selectedProject.id
        })
      });

      if (res.ok) {
        setReviewStatus({ type: 'success', text: 'Review request email sent to client!' });
      } else {
        setReviewStatus({ type: 'error', text: 'Failed to send. Resend API key might be missing.' });
      }
    } catch (err) {
      setReviewStatus({ type: 'error', text: 'Network connection failed.' });
    } finally {
      setSendingReview(false);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-xs font-semibold text-zinc-500">
      
      {/* -------------------- DYNAMIC GRID OF CARDS -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => {
          // Calculate milestones progress ratio
          const mockTotalM = 3;
          const mockCompletedM = 1;
          const percent = Math.round((mockCompletedM / mockTotalM) * 100);

          return (
            <div
              key={project.id}
              onClick={() => openProjectDrawer(project)}
              className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] p-6 shadow-sm hover:border-purple-500/25 hover:shadow-lg hover:shadow-purple-500/5 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header title */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 group-hover:text-purple-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-1 font-bold">Client: {project.client_name || 'N/A'}</p>
                  </div>
                </div>

                {/* Pipeline Tracker */}
                <div className="flex justify-between items-center gap-1 my-5 bg-zinc-50 dark:bg-[#0d0d0d] p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-800/80">
                  {PIPELINE_STATUSES.map((step) => {
                    const isActive = project.status === step.value;
                    return (
                      <span
                        key={step.value}
                        className={`text-[8px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded ${
                          isActive
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-zinc-400 dark:text-zinc-600'
                        }`}
                      >
                        {step.label}
                      </span>
                    );
                  })}
                </div>

                {/* Project stats */}
                <div className="grid grid-cols-2 gap-4 mb-5 text-[10px]">
                  <div>
                    <span className="text-zinc-400 uppercase tracking-wider block">Budget</span>
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-1 block">
                      {project.budget?.toLocaleString() || '150'} {project.currency || 'OMR'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 uppercase tracking-wider block">Deadline</span>
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-1 block">
                      {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Buttons */}
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-[9px] uppercase tracking-wider font-bold mb-1">
                    <span className="text-zinc-400">Milestones</span>
                    <span className="text-purple-400">{mockCompletedM}/{mockTotalM} ({percent}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openProjectDrawer(project); }}
                    className="flex-1 py-2 px-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 hover:bg-purple-500/5 hover:border-purple-500/20 text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer text-center"
                  >
                    Manage Project
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* -------------------- SLIDEOUT DETAIL SHEET DRAWER -------------------- */}
      {selectedProject && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setSelectedProject(null)}
          />
          {/* Drawer container panel */}
          <div className="relative flex flex-col w-[380px] sm:w-[500px] h-full bg-white dark:bg-[#141414] border-l border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl z-10 overflow-y-auto animate-slide-in">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-purple-400" />
                <span>Freelance Project Dashboard</span>
              </span>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-400"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Editable Title */}
            <div className="mb-6">
              <input
                type="text"
                value={selectedProject.title}
                onChange={(e) => handleUpdateProjectField({ title: e.target.value })}
                className="w-full bg-transparent border-none outline-none text-base font-extrabold text-zinc-800 dark:text-zinc-100 focus:ring-1 focus:ring-purple-500/30 rounded p-1"
              />
            </div>

            {/* Status Select Pipeline dropdown */}
            <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status Step</label>
                <select
                  value={selectedProject.status}
                  onChange={(e) => handleUpdateProjectField({ status: e.target.value as Project['status'] })}
                  className="w-full mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-zinc-700 dark:text-zinc-200 outline-none"
                >
                  {PIPELINE_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Budget Amount</label>
                <input
                  type="number"
                  value={selectedProject.budget || ''}
                  onChange={(e) => handleUpdateProjectField({ budget: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-zinc-700 dark:text-zinc-200 outline-none"
                />
              </div>
            </div>

            {/* Client Info Sub Card */}
            <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-850 p-4 space-y-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Client Details</h4>
              <div className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                <p><strong>Name:</strong> {selectedProject.client_name || 'N/A'}</p>
                <p><strong>Company:</strong> {selectedProject.client_company || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedProject.client_email || 'N/A'}</p>
              </div>
              
              {/* Send Review requests button */}
              {selectedProject.status === 'review' && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
                  <button
                    onClick={sendReviewRequest}
                    disabled={sendingReview}
                    className="inline-flex items-center gap-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-3 py-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send Review Request</span>
                  </button>
                  {reviewStatus && (
                    <span className={`text-[10px] ml-3 font-semibold ${reviewStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {reviewStatus.text}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Milestones Checklist */}
            <div className="mb-6 space-y-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Project Milestones Checklist</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {milestones.map((m) => (
                  <div 
                    key={m.id} 
                    onClick={() => toggleMilestone(m.id)}
                    className="flex items-center justify-between text-xs cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 p-1.5 rounded transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      {m.completed ? (
                        <CheckSquare className="h-4.5 w-4.5 text-purple-500" />
                      ) : (
                        <Square className="h-4.5 w-4.5 text-zinc-400" />
                      )}
                      <span className={`text-zinc-700 dark:text-zinc-200 ${m.completed ? 'line-through opacity-55' : ''}`}>
                        {m.title}
                      </span>
                    </div>
                    {m.due_date && <span className="text-[10px] text-zinc-400">{m.due_date}</span>}
                  </div>
                ))}
              </div>

              {/* Add Milestone Inline */}
              <div className="flex gap-2 items-center mt-2">
                <input
                  type="text"
                  placeholder="New milestone..."
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-3.5 text-xs text-zinc-100 outline-none"
                />
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  className="w-28 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-xs text-zinc-100 outline-none"
                />
                <button
                  onClick={addMilestone}
                  disabled={!newMilestoneTitle.trim()}
                  className="p-2 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Time Logs */}
            <div className="mb-6 space-y-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Logged Hours History</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {timeLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center text-xs border-b border-zinc-100 dark:border-zinc-800 pb-1.5 last:border-none last:pb-0">
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300 font-semibold">{log.note}</p>
                      <span className="text-[10px] text-zinc-500">{log.date}</span>
                    </div>
                    <span className="text-xs font-extrabold text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-500/10">
                      {log.hours} h
                    </span>
                  </div>
                ))}
              </div>

              {/* Log Hours Form */}
              <div className="flex gap-2 items-center mt-2">
                <input
                  type="number"
                  step="0.5"
                  placeholder="Hrs"
                  value={logHoursVal}
                  onChange={(e) => setLogHoursVal(e.target.value)}
                  className="w-16 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-xs text-zinc-100 outline-none text-center"
                />
                <input
                  type="text"
                  placeholder="Task note..."
                  value={logHoursNote}
                  onChange={(e) => setLogHoursNote(e.target.value)}
                  className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-3.5 text-xs text-zinc-100 outline-none"
                />
                <button
                  onClick={addTimeLog}
                  disabled={!logHoursVal}
                  className="p-2 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Invoices History */}
            <div className="mb-6 space-y-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Invoice History</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center text-xs border-b border-zinc-100 dark:border-zinc-800 pb-1.5 last:border-none last:pb-0">
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300 font-extrabold">{inv.amount} {inv.currency}</p>
                      <span className="text-[10px] text-zinc-500">Due: {inv.due_date}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      inv.status === 'paid' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                      inv.status === 'overdue' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' :
                      'border-amber-500/20 bg-amber-500/10 text-amber-400'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Invoice Form */}
              <div className="flex gap-2 items-center mt-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={invAmount}
                  onChange={(e) => setInvAmount(e.target.value)}
                  className="w-24 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-xs text-zinc-100 outline-none text-center"
                />
                <input
                  type="date"
                  value={invDueDate}
                  onChange={(e) => setInvDueDate(e.target.value)}
                  className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-3 text-xs text-zinc-100 outline-none"
                />
                <button
                  onClick={createInvoice}
                  disabled={!invAmount || !invDueDate}
                  className="p-2 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

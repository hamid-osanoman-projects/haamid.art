'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, Search, Filter, Mail, Phone, Globe, Edit, X, Plus, 
  ChevronRight, Calendar, Briefcase, FileText, CheckCircle2, Star, Save
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  country?: string;
  notes?: string;
  next_action?: string;
  created_at?: string;
  
  // Dynamic metrics
  activeProjectsCount?: number;
  lastContactDate?: string;
  magic_link_token?: string;
}

interface LinkedProject {
  id: string;
  title: string;
  status: string;
  due_date?: string;
}

interface LinkedMeeting {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
}

interface LinkedReview {
  id: string;
  rating: number;
  content: string;
  status: string;
}

interface ClientsDirectoryProps {
  initialClients: Client[];
}

export default function ClientsDirectory({ initialClients }: ClientsDirectoryProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');

  // Sub-data states associated with the active selected client
  const [linkedProjects, setLinkedProjects] = useState<LinkedProject[]>([]);
  const [linkedMeetings, setLinkedMeetings] = useState<LinkedMeeting[]>([]);
  const [linkedReview, setLinkedReview] = useState<LinkedReview | null>(null);
  
  // Custom new client form modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '', company: '', email: '', phone: '', country: 'Oman', notes: '', next_action: ''
  });

  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const supabase = createClient();

  // Load sub-list relations when client detail sheet opens
  const openClientSheet = (client: Client) => {
    setSelectedClient(client);

    // Dynamic mock relations
    setLinkedProjects([
      { id: 'p1', title: 'Corporate Website Redesign', status: 'in_progress', due_date: '2026-07-02' },
      { id: 'p2', title: 'Telemetry Data Dashboard', status: 'review', due_date: '2026-06-25' }
    ]);

    setLinkedMeetings([
      { id: 'm1', title: 'Sprint Retrospective', scheduled_at: '2026-06-25T10:00:00Z', status: 'done' },
      { id: 'm2', title: 'Milestone 2 Review Call', scheduled_at: '2026-07-01T11:30:00Z', status: 'upcoming' }
    ]);

    setLinkedReview({
      id: 'r1',
      rating: 5,
      content: 'Hamid did an exceptional job building our portal. Extremely fast and premium look!',
      status: 'approved'
    });
  };

  const handleUpdateClientField = async (fields: Partial<Client>) => {
    if (!selectedClient) return;
    const updated = { ...selectedClient, ...fields };
    setSelectedClient(updated);
    setClients(prev => prev.map(c => c.id === selectedClient.id ? updated : c));

    try {
      await supabase.from('clients').update(fields).eq('id', selectedClient.id);
    } catch (err) {
      console.error('Client details sync failed:', err);
    }
  };

  const generateMagicLink = async () => {
    if (!selectedClient) return;
    setIsGeneratingLink(true);
    setCopiedLink(false);

    try {
      const res = await fetch(`/api/clients/${selectedClient.id}/magic-link`, { method: 'POST' });
      if (res.ok) {
        const { token } = await res.json();
        
        // Update local state
        const updated = { ...selectedClient, magic_link_token: token };
        setSelectedClient(updated);
        setClients(prev => prev.map(c => c.id === selectedClient.id ? updated : c));
      }
    } catch (err) {
      console.error('Failed to generate magic link:', err);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyMagicLink = () => {
    if (!selectedClient?.magic_link_token) return;
    const url = `${window.location.origin}/client/${selectedClient.magic_link_token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.name.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const insertData = {
        ...newClientForm,
        user_id: user?.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(insertData)
        .select()
        .single();

      if (!error && data) {
        setClients(prev => [
          ...prev,
          { ...data, activeProjectsCount: 0, lastContactDate: 'Today' }
        ]);
      } else {
        const mockNew: Client = {
          id: Math.random().toString(),
          ...insertData,
          activeProjectsCount: 0,
          lastContactDate: 'Today'
        };
        setClients(prev => [...prev, mockNew]);
      }

      setIsAddModalOpen(false);
      setNewClientForm({ name: '', company: '', email: '', phone: '', country: 'Oman', notes: '', next_action: '' });
    } catch (err) {
      console.error('Failed to create client:', err);
    }
  };

  // Unique list of client countries for filter option
  const countries = ['all', ...Array.from(new Set(clients.map(c => c.country).filter(Boolean)))];

  // Filtering filter calculations
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = countryFilter === 'all' || c.country === countryFilter;

    return matchesSearch && matchesCountry;
  });

  return (
    <div className="space-y-6 select-none font-sans text-xs font-semibold text-zinc-500">
      
      {/* -------------------- SEARCH & CREATE ACTIONS BAR -------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#e5e5e5] dark:border-[#262626] pb-4 bg-white dark:bg-[#0d0d0d]">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          
          {/* Live Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, or email..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 py-2 pr-4 pl-10 text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:border-purple-500/50 focus:bg-white dark:focus:bg-zinc-900"
            />
          </div>

          {/* Country filter select dropdown */}
          <div className="relative w-full sm:w-44">
            <Globe className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 py-2 pr-4 pl-10 text-xs text-zinc-700 dark:text-zinc-300 outline-none appearance-none cursor-pointer"
            >
              {countries.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Countries' : c}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Global Add Client Trigger Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-2 px-4 font-bold text-white transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Client</span>
        </button>
      </div>

      {/* -------------------- CLIENTS TABLE -------------------- */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-[#141414] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase text-zinc-400 tracking-wider font-bold">
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Email Address</th>
              <th className="px-6 py-4 text-center">Active Projects</th>
              <th className="px-6 py-4">Last Contact</th>
              <th className="px-6 py-4">Next Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {filteredClients.map((client) => (
              <tr 
                key={client.id}
                onClick={() => openClientSheet(client)}
                className="hover:bg-zinc-55/40 dark:hover:bg-[#1a1a1a]/60 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">{client.name}</td>
                <td className="px-6 py-4">{client.company || '—'}</td>
                <td className="px-6 py-4 font-mono text-[11px] text-zinc-500">{client.email || '—'}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-block bg-purple-950/10 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-500/10 px-2 py-0.5 rounded font-bold">
                    {client.activeProjectsCount || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-500">{client.lastContactDate || 'Never'}</td>
                <td className="px-6 py-4">
                  {client.next_action ? (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded">
                      {client.next_action}
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-normal">No scheduled task</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* -------------------- DETAIL SHEETS -------------------- */}
      {selectedClient && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedClient(null)} />
          
          {/* Drawer container panel */}
          <div className="relative flex flex-col w-[380px] sm:w-[480px] h-full bg-white dark:bg-[#141414] border-l border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl z-10 overflow-y-auto animate-slide-in">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-purple-400" />
                <span>Client Profile CRM</span>
              </span>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-400"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Client Name Input */}
            <div className="mb-6">
              <input
                type="text"
                value={selectedClient.name}
                onChange={(e) => handleUpdateClientField({ name: e.target.value })}
                className="w-full bg-transparent border-none outline-none text-base font-extrabold text-zinc-800 dark:text-zinc-100 focus:ring-1 focus:ring-purple-500/30 rounded p-1"
              />
            </div>

            {/* Client Portal Access Section */}
            <div className="mb-6 bg-purple-950/20 border border-purple-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Client Portal Access</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">Generate a secure passwordless link for this client to view their project timeline and invoices.</p>
                </div>
              </div>
              
              {selectedClient.magic_link_token ? (
                <div className="space-y-2">
                  <div className="bg-black/50 border border-zinc-800 rounded p-2 text-[10px] font-mono text-purple-300 break-all select-all">
                    {`${window.location.origin}/client/${selectedClient.magic_link_token}`}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyMagicLink}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors"
                    >
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={generateMagicLink}
                      disabled={isGeneratingLink}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Revoke & Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generateMagicLink}
                  disabled={isGeneratingLink}
                  className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isGeneratingLink ? 'Generating...' : 'Generate Magic Link'}
                </button>
              )}
            </div>

            {/* CRM Contact Details list */}
            <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-850 p-4 space-y-4">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Contact Details</h4>
              <div className="space-y-3.5">
                
                {/* Company */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-zinc-500">Company</span>
                  <input
                    type="text"
                    value={selectedClient.company || ''}
                    onChange={(e) => handleUpdateClientField({ company: e.target.value })}
                    className="bg-transparent border-none outline-none text-right text-zinc-700 dark:text-zinc-300 font-bold focus:bg-zinc-100 dark:focus:bg-zinc-800 px-2 py-0.5 rounded"
                  />
                </div>

                {/* Email */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-zinc-500">Email</span>
                  <input
                    type="email"
                    value={selectedClient.email || ''}
                    onChange={(e) => handleUpdateClientField({ email: e.target.value })}
                    className="bg-transparent border-none outline-none text-right text-zinc-700 dark:text-zinc-300 font-mono text-[11px] focus:bg-zinc-100 dark:focus:bg-zinc-800 px-2 py-0.5 rounded"
                  />
                </div>

                {/* Phone */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-zinc-500">Phone</span>
                  <input
                    type="text"
                    value={selectedClient.phone || ''}
                    onChange={(e) => handleUpdateClientField({ phone: e.target.value })}
                    className="bg-transparent border-none outline-none text-right text-zinc-700 dark:text-zinc-300 font-bold focus:bg-zinc-100 dark:focus:bg-zinc-800 px-2 py-0.5 rounded"
                  />
                </div>

                {/* Country */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-zinc-500">Country</span>
                  <input
                    type="text"
                    value={selectedClient.country || ''}
                    onChange={(e) => handleUpdateClientField({ country: e.target.value })}
                    className="bg-transparent border-none outline-none text-right text-zinc-700 dark:text-zinc-300 font-bold focus:bg-zinc-100 dark:focus:bg-zinc-800 px-2 py-0.5 rounded"
                  />
                </div>

              </div>
            </div>

            {/* Next Action Box */}
            <div className="mb-6">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-2">Next CRM Action</label>
              <input
                type="text"
                value={selectedClient.next_action || ''}
                onChange={(e) => handleUpdateClientField({ next_action: e.target.value })}
                placeholder="What is the next checkpoint task with this client?"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 py-2.5 px-4 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-purple-500/40"
              />
            </div>

            {/* Linked Projects */}
            <div className="mb-6 space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-zinc-500" />
                <span>Linked Projects</span>
              </h4>
              <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {linkedProjects.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <span className="text-zinc-700 dark:text-zinc-200 font-semibold">{p.title}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950/10 text-purple-400 border border-purple-500/10">
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meeting History */}
            <div className="mb-6 space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span>Meeting History</span>
              </h4>
              <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {linkedMeetings.map((m) => (
                  <div key={m.id} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-200 font-semibold">{m.title}</p>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(m.scheduled_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      m.status === 'done'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Section */}
            {linkedReview && (
              <div className="mb-6 space-y-2">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-zinc-500" />
                  <span>Submitted Testimonial Review</span>
                </h4>
                <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-xl space-y-2.5">
                  <div className="flex gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < linkedReview.rating ? 'fill-current' : 'text-zinc-700'}`} />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-xs italic">"{linkedReview.content}"</p>
                </div>
              </div>
            )}

            {/* Rich text notes */}
            <div className="mb-6 space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">General Notes</label>
              <textarea
                rows={5}
                value={selectedClient.notes || ''}
                onChange={(e) => handleUpdateClientField({ notes: e.target.value })}
                placeholder="Log corporate goals, project guidelines, meeting highlights, or client comments here..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent py-3 px-4 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-500 outline-none focus:border-purple-500/40"
              />
            </div>

          </div>
        </div>
      )}

      {/* -------------------- ADD CLIENT FORM MODAL -------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          
          {/* Form Modal Box container */}
          <form 
            onSubmit={handleAddClient}
            className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl z-10 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                <span>Add New Corporate Client</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded hover:bg-zinc-900 text-zinc-400"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Inputs grid */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Client Name</label>
                <input
                  type="text"
                  required
                  value={newClientForm.name}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="E.g. Sarah Jenkins"
                  className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 px-3.5 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Company / Entity</label>
                <input
                  type="text"
                  value={newClientForm.company}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="E.g. Vortex Media"
                  className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 px-3.5 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="sarah@vortex.com"
                    className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 px-3.5 text-xs text-zinc-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Country Location</label>
                  <input
                    type="text"
                    value={newClientForm.country}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="E.g. Oman"
                    className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 px-3.5 text-xs text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Next Action Checkpoint</label>
                <input
                  type="text"
                  value={newClientForm.next_action}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, next_action: e.target.value }))}
                  placeholder="E.g. Send website proposal draft"
                  className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 px-3.5 text-xs text-zinc-100 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!newClientForm.name.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-3 px-4 font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Add Client Profile</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

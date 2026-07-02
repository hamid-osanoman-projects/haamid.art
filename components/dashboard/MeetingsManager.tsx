'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar, List, Plus, X, Clock, HelpCircle, ShieldCheck, 
  MapPin, CheckSquare, Square, Edit, ArrowLeft, ArrowRight, User 
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  type: string; // client_call, retro, kickoff, review
  scheduled_at: string;
  duration: number; // in mins
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  agenda?: string[];
  client_id?: string | null;
  client_name?: string;
}

interface MeetingsManagerProps {
  initialMeetings: Meeting[];
  clients: { id: string; name: string }[];
}

export default function MeetingsManager({ initialMeetings, clients }: MeetingsManagerProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  // View toggle: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  // Agenda checklist sub-state
  const [agendaItems, setAgendaItems] = useState<{ text: string; done: boolean }[]>([]);
  const [newAgendaText, setNewAgendaText] = useState('');

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Reschedule date picker state
  const [rescheduleDate, setRescheduleDate] = useState('');
  
  // Add meeting modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMeetingForm, setNewMeetingForm] = useState({
    title: '', type: 'client_call', client_id: '', scheduled_at: '', duration: 30, notes: '', agendaInput: ''
  });

  const supabase = createClient();

  useEffect(() => {
    if (selectedMeeting) {
      // Map array of strings to checklists
      const items = (selectedMeeting.agenda || []).map(text => ({ text, done: false }));
      setAgendaItems(items);
      setRescheduleDate(selectedMeeting.scheduled_at.split('Z')[0]);
    } else {
      setAgendaItems([]);
    }
  }, [selectedMeeting?.id]);

  const openMeetingSheet = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleUpdateMeetingField = async (fields: Partial<Meeting>) => {
    if (!selectedMeeting) return;
    const updated = { ...selectedMeeting, ...fields };
    setSelectedMeeting(updated);
    setMeetings(prev => prev.map(m => m.id === selectedMeeting.id ? updated : m));

    try {
      await supabase.from('meetings').update(fields).eq('id', selectedMeeting.id);
    } catch (err) {
      console.error('Meeting updates failed:', err);
    }
  };

  const toggleAgendaItem = (idx: number) => {
    setAgendaItems(prev => {
      const copy = [...prev];
      copy[idx].done = !copy[idx].done;
      return copy;
    });
  };

  const addAgendaItem = () => {
    if (!newAgendaText.trim()) return;
    setAgendaItems(prev => [...prev, { text: newAgendaText, done: false }]);
    const currentAgendaList = [...agendaItems.map(a => a.text), newAgendaText];
    handleUpdateMeetingField({ agenda: currentAgendaList });
    setNewAgendaText('');
  };

  const handleReschedule = () => {
    if (!rescheduleDate) return;
    handleUpdateMeetingField({ scheduled_at: new Date(rescheduleDate).toISOString() });
  };

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingForm.title.trim() || !newMeetingForm.scheduled_at) return;

    const agendaArr = newMeetingForm.agendaInput
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    const client = clients.find(c => c.id === newMeetingForm.client_id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const insertData = {
        title: newMeetingForm.title,
        type: newMeetingForm.type,
        client_id: newMeetingForm.client_id || null,
        scheduled_at: new Date(newMeetingForm.scheduled_at).toISOString(),
        duration: Number(newMeetingForm.duration),
        status: 'upcoming' as const,
        notes: newMeetingForm.notes,
        agenda: agendaArr,
        user_id: user?.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('meetings')
        .insert(insertData)
        .select()
        .single();

      if (!error && data) {
        setMeetings(prev => [
          ...prev,
          { ...data, client_name: client?.name || 'N/A' }
        ]);
      } else {
        const mockNew: Meeting = {
          id: Math.random().toString(),
          ...insertData,
          client_name: client?.name || 'N/A'
        };
        setMeetings(prev => [...prev, mockNew]);
      }

      setIsAddModalOpen(false);
      setNewMeetingForm({ title: '', type: 'client_call', client_id: '', scheduled_at: '', duration: 30, notes: '', agendaInput: '' });
    } catch (err) {
      console.error('Failed to schedule meeting:', err);
    }
  };

  // Monthly calendar calculation helpers
  const year = currentDate.getFullYear();
  const monthIdx = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIdx - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, monthIdx + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const startDayOfWeek = new Date(year, monthIdx, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calendar squares layout array
  const calendarSquares: (number | null)[] = [];
  // Add empty placeholders before 1st of month
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarSquares.push(null);
  }
  // Add day numbers
  for (let d = 1; d <= daysInMonth; d++) {
    calendarSquares.push(d);
  }

  // Filter meetings occurring on selected calendar date
  const getSelectedDateMeetings = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return meetings.filter(m => m.scheduled_at.startsWith(dateStr));
  };

  return (
    <div className="space-y-6 select-none font-sans text-xs font-semibold text-zinc-500">
      
      {/* -------------------- VIEW TOGGLE & SCHEDULER ACTIONS -------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#e5e5e5] dark:border-[#262626] pb-4 bg-white dark:bg-[#0d0d0d]">
        <div className="flex items-center gap-1.5 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#141414] text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <List className="h-4 w-4" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-[#141414] text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Calendar Grid</span>
          </button>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-2 px-4 font-bold text-white transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Appointment</span>
        </button>
      </div>

      {/* -------------------- MAIN DISPLAY SWITCHER -------------------- */}
      {viewMode === 'list' ? (
        
        /* LIST VIEW MODULE */
        <div className="overflow-x-auto rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-[#141414] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase text-zinc-400 tracking-wider font-bold">
                <th className="px-6 py-4">Meeting Time</th>
                <th className="px-6 py-4">Agenda Title</th>
                <th className="px-6 py-4">Appointment Type</th>
                <th className="px-6 py-4">Related Client</th>
                <th className="px-6 py-4 text-center">Duration</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {meetings.map((meeting) => (
                <tr 
                  key={meeting.id}
                  onClick={() => openMeetingSheet(meeting)}
                  className="hover:bg-zinc-55/40 dark:hover:bg-[#1a1a1a]/60 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-[11px] text-zinc-500">
                    {new Date(meeting.scheduled_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">{meeting.title}</td>
                  <td className="px-6 py-4 capitalize">{meeting.type.replace('_', ' ')}</td>
                  <td className="px-6 py-4">{meeting.client_name || '—'}</td>
                  <td className="px-6 py-4 text-center text-purple-400 font-bold">{meeting.duration}m</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      meeting.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                      meeting.status === 'cancelled' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' :
                      'border-blue-500/20 bg-blue-500/10 text-blue-400'
                    }`}>
                      {meeting.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      ) : (

        /* CALENDAR VIEW GRID MODULE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Grid Left block calendar monthly */}
          <div className="lg:col-span-8 rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-[#141414] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">
                {monthNames[monthIdx]} {year}
              </h3>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer">
                  <ArrowLeft className="h-4.5 w-4.5" />
                </button>
                <button onClick={handleNextMonth} className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer">
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-extrabold uppercase text-zinc-400">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            {/* Calendar grid boxes */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {calendarSquares.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={idx} className="h-16" />;
                }

                // Check active selected date
                const squareDate = new Date(year, monthIdx, dayNum);
                const isSelected = selectedDate && selectedDate.toDateString() === squareDate.toDateString();
                
                // Fetch scheduled count
                const dateStr = squareDate.toISOString().split('T')[0];
                const dayMeetings = meetings.filter(m => m.scheduled_at.startsWith(dateStr));

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(squareDate)}
                    className={`h-16 rounded-xl border flex flex-col justify-between p-2 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-[#1f1f1f] ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/5 dark:bg-purple-950/20'
                        : 'border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#0d0d0d]'
                    }`}
                  >
                    <span className={`text-[10px] font-bold self-start ${isSelected ? 'text-purple-400' : 'text-zinc-500'}`}>{dayNum}</span>
                    {dayMeetings.length > 0 && (
                      <div className="flex gap-1 justify-center">
                        {dayMeetings.map((_, i) => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Right block list for selected day */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-[#141414] p-6 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                Meetings on {selectedDate ? selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Selected Day'}
              </h3>
              
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {getSelectedDateMeetings().length > 0 ? (
                  getSelectedDateMeetings().map((m) => (
                    <div 
                      key={m.id}
                      onClick={() => openMeetingSheet(m)}
                      className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-[#0d0d0d] hover:border-purple-500/30 cursor-pointer transition-all"
                    >
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-100">{m.title}</h4>
                      <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(m.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({m.duration}m)</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 italic py-4">No meetings scheduled for this day.</p>
                )}
              </div>
            </div>
          </div>

        </div>

      )}

      {/* -------------------- DETAIL SHEET DRAWER -------------------- */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedMeeting(null)} />
          
          {/* Drawer container panel */}
          <div className="relative flex flex-col w-[380px] sm:w-[480px] h-full bg-white dark:bg-[#141414] border-l border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl z-10 overflow-y-auto animate-slide-in">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-purple-400" />
                <span>Appointment Detail Sheet</span>
              </span>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-400"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Editable Title */}
            <div className="mb-6">
              <input
                type="text"
                value={selectedMeeting.title}
                onChange={(e) => handleUpdateMeetingField({ title: e.target.value })}
                className="w-full bg-transparent border-none outline-none text-base font-extrabold text-zinc-800 dark:text-zinc-100 focus:ring-1 focus:ring-purple-500/30 rounded p-1"
              />
            </div>

            {/* Status Details Select box */}
            <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</label>
                <select
                  value={selectedMeeting.status}
                  onChange={(e) => handleUpdateMeetingField({ status: e.target.value as Meeting['status'] })}
                  className="w-full mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-zinc-700 dark:text-zinc-200 outline-none"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Appointment Type</label>
                <select
                  value={selectedMeeting.type}
                  onChange={(e) => handleUpdateMeetingField({ type: e.target.value })}
                  className="w-full mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-zinc-700 dark:text-zinc-200 outline-none animate-none capitalize"
                >
                  <option value="client_call">Client Call</option>
                  <option value="kickoff">Kickoff Session</option>
                  <option value="retro">Sprint Retro</option>
                  <option value="review">Design Review</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duration (Mins)</label>
                <input
                  type="number"
                  value={selectedMeeting.duration}
                  onChange={(e) => handleUpdateMeetingField({ duration: parseInt(e.target.value) || 30 })}
                  className="w-full mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-zinc-700 dark:text-zinc-200 outline-none text-center"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Related Client</label>
                <span className="w-full mt-1.5 inline-block py-1.5 text-zinc-800 dark:text-zinc-200 font-bold">
                  {selectedMeeting.client_name || 'N/A'}
                </span>
              </div>
            </div>

            {/* Agenda Checklist */}
            <div className="mb-6 space-y-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Meeting Agenda Items</h4>
              <div className="space-y-2 max-h-36 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {agendaItems.length > 0 ? (
                  agendaItems.map((agenda, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => toggleAgendaItem(idx)}
                      className="flex items-center gap-2.5 text-xs cursor-pointer py-1 text-zinc-700 dark:text-zinc-250 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20 px-1 rounded transition-colors"
                    >
                      {agenda.done ? (
                        <CheckSquare className="h-4.5 w-4.5 text-purple-500" />
                      ) : (
                        <Square className="h-4.5 w-4.5 text-zinc-400" />
                      )}
                      <span className={agenda.done ? 'line-through opacity-55' : ''}>{agenda.text}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 italic py-2">No agenda items defined.</p>
                )}
              </div>

              {/* Add Agenda Inline */}
              <div className="flex gap-2 items-center mt-2">
                <input
                  type="text"
                  placeholder="New agenda item..."
                  value={newAgendaText}
                  onChange={(e) => setNewAgendaText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAgendaItem()}
                  className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-3.5 text-xs text-zinc-100 outline-none"
                />
                <button
                  onClick={addAgendaItem}
                  disabled={!newAgendaText.trim()}
                  className="p-2 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notes Log field */}
            <div className="mb-6 space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Meeting Session Notes</label>
              <textarea
                rows={4}
                value={selectedMeeting.notes || ''}
                onChange={(e) => handleUpdateMeetingField({ notes: e.target.value })}
                placeholder="Log decisions, feedback notes, follow-up actions..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent py-3 px-4 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-500 outline-none focus:border-purple-500/40"
              />
            </div>

            {/* Reschedule Datepicker trigger */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-6 mt-6 space-y-3">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Reschedule Date & Time</label>
              <div className="flex gap-3">
                <input
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2.5 text-xs text-zinc-200 outline-none"
                />
                <button
                  onClick={handleReschedule}
                  className="rounded-md bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-4 py-2 transition-all cursor-pointer"
                >
                  Confirm Date
                </button>
              </div>

              {selectedMeeting.status !== 'completed' && (
                <button
                  onClick={() => {
                    handleUpdateMeetingField({ status: 'completed' });
                    setSelectedMeeting(null);
                  }}
                  className="w-full rounded-xl border border-dashed border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-400 text-xs font-bold py-2.5 transition-colors cursor-pointer"
                >
                  Mark Meeting As Done
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* -------------------- ADD APPOINTMENT FORM MODAL -------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          
          {/* Form Modal Box container */}
          <form 
            onSubmit={handleAddMeeting}
            className="relative w-full max-w-md rounded-2xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl z-10 space-y-4 text-xs font-semibold text-zinc-400"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                <span>Schedule New Meeting</span>
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
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={newMeetingForm.title}
                  onChange={(e) => setNewMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="E.g. Design Review Session"
                  className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 px-3.5 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Meeting Type</label>
                  <select
                    value={newMeetingForm.type}
                    onChange={(e) => setNewMeetingForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 px-3 text-xs text-zinc-200 outline-none cursor-pointer"
                  >
                    <option value="client_call">Client Call</option>
                    <option value="kickoff">Kickoff Session</option>
                    <option value="retro">Sprint Retro</option>
                    <option value="review">Design Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duration (Mins)</label>
                  <input
                    type="number"
                    value={newMeetingForm.duration}
                    onChange={(e) => setNewMeetingForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                    className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2 px-3 text-xs text-zinc-100 outline-none text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Related Client</label>
                  <select
                    value={newMeetingForm.client_id}
                    onChange={(e) => setNewMeetingForm(prev => ({ ...prev, client_id: e.target.value }))}
                    className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 px-3 text-xs text-zinc-200 outline-none cursor-pointer"
                  >
                    <option value="">No Client Linked</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newMeetingForm.scheduled_at}
                    onChange={(e) => setNewMeetingForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 px-2 text-[11px] text-zinc-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Meeting Agenda (One per line)</label>
                <textarea
                  rows={3}
                  value={newMeetingForm.agendaInput}
                  onChange={(e) => setNewMeetingForm(prev => ({ ...prev, agendaInput: e.target.value }))}
                  placeholder="Review mockup drafts&#10;Align on stripe integrations"
                  className="w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2 px-3.5 text-xs text-zinc-100 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!newMeetingForm.title.trim() || !newMeetingForm.scheduled_at}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-3 px-4 font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Schedule Appointment</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { 
  Users, Plus, Trash2, Key, Copy, Check, Radio, Play, Phone, Video, Tv,
  X, CheckSquare, Square, Calendar, Clock, Loader2, AlertCircle 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Contact {
  id: string
  name: string
  relation: string
  code: string
  avatar_emoji: string
  avatar_color: string
  is_online: boolean
  last_seen_at: string | null
}

interface CallLog {
  id: string
  joined_at: string
  left_at: string | null
  duration_seconds: number | null
  vibe_contacts: {
    name: string
    avatar_emoji: string
    avatar_color: string
  } | null
}

interface ActiveRoom {
  id: string
  room_name: string
  display_name: string
  type: 'call' | 'watch_party' | 'p2p_call'
  watch_url: string
  invited_contact_ids: string[]
}

const EMOJIS = ['👨‍💻', '🔮', '👑', '🔥', '🎮', '⚽', '🥑', '🍔', '🚀', '⭐', '💡', '📱', '🎬', '🎵', '🍕', '🦄', '🐱', '🐶', '🦊', '🐻']
const COLORS = ['#7F77DD', '#3ECF8E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']

export default function LobbyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null)
  
  // Modal & form states
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRelation, setNewRelation] = useState('friend')
  const [selectedEmoji, setSelectedEmoji] = useState('👨‍💻')
  const [selectedColor, setSelectedColor] = useState('#7F77DD')
  const [generatedCode, setGeneratedCode] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  
  // Detail sidebar state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  // Call invitation states
  const [invitedContacts, setInvitedContacts] = useState<string[]>([])
  const [streamUrl, setStreamUrl] = useState('')
  const [callType, setCallType] = useState<'call' | 'watch_party' | 'p2p_call'>('call')
  
  // Operations loading states
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStartingRoom, setIsStartingRoom] = useState(false)

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'hamid@haaamid.art'

  // Authenticate user & load profile
  useEffect(() => {
    async function authCheck() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      if (authUser.email !== ownerEmail) {
        router.push('/dashboard')
        return
      }

      setUser(authUser)

      // Fetch user profile details
      let currentProfile = {
        name: 'Hamid U V',
        email: authUser.email,
        available: true,
        avatar_url: null,
      }

      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (profData) {
        currentProfile = {
          ...currentProfile,
          name: profData.name || currentProfile.name,
          available: profData.available ?? true,
          avatar_url: profData.avatar_url || null,
        }
      }
      setProfile(currentProfile)
      setIsPageLoading(false)
      
      // Fetch operational dashboard data
      fetchDashboardData(authUser.id)
    }

    authCheck()
  }, [])

  // Real-time Postgres changes for contacts & rooms list
  useEffect(() => {
    if (!user) return

    const contactsChannel = supabase
      .channel('vibe_lobby_contacts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vibe_contacts' }, () => {
        fetchContacts(user.id)
      })
      .subscribe()

    const roomsChannel = supabase
      .channel('vibe_lobby_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vibe_rooms' }, () => {
        fetchActiveRoom(user.id)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(contactsChannel)
      supabase.removeChannel(roomsChannel)
    }
  }, [user])

  async function fetchDashboardData(userId: string) {
    await Promise.all([
      fetchContacts(userId),
      fetchActiveRoom(userId),
      fetchCallLogs()
    ])
  }

  async function fetchContacts(userId: string) {
    const { data } = await supabase
      .from('vibe_contacts')
      .select('*')
      .eq('owner_id', userId)
      .order('name', { ascending: true })
    
    setContacts(data || [])
  }

  async function fetchActiveRoom(userId: string) {
    const { data } = await supabase
      .from('vibe_rooms')
      .select('*')
      .eq('owner_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (data && data.room_name.startsWith('p2p-')) {
      data.type = 'p2p_call'
    }

    setActiveRoom(data || null)
  }

  async function fetchCallLogs() {
    const { data } = await supabase
      .from('vibe_call_log')
      .select(`
        id,
        joined_at,
        left_at,
        duration_seconds,
        vibe_contacts (
          name,
          avatar_emoji,
          avatar_color
        )
      `)
      .order('joined_at', { ascending: false })
      .limit(10)

    setCallLogs((data as any) || [])
  }

  // Pre-generate contact code in modal
  const handleRelationChange = (val: string) => {
    setNewRelation(val)
    const prefix = val === 'family' ? 'fam' : val === 'friend' ? 'bro' : val === 'relative' ? 'rel' : 'vibe'
    const rand = Math.random().toString(36).slice(2, 6)
    setGeneratedCode(`${prefix}-${rand}`)
  }

  const openAddModal = () => {
    setNewName('')
    handleRelationChange('friend')
    setSelectedEmoji('👨‍💻')
    setSelectedColor('#7F77DD')
    setCopiedCode(false)
    setShowAddModal(true)
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !user) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('vibe_contacts')
        .insert({
          owner_id: user.id,
          name: newName.trim(),
          relation: newRelation,
          code: generatedCode.toLowerCase(),
          avatar_emoji: selectedEmoji,
          avatar_color: selectedColor
        })

      if (error) throw error

      // Close the modal automatically as requested
      setShowAddModal(false)
      fetchContacts(user.id)
      setIsSubmitting(false)
      alert('Contact created successfully! You can copy their access code from the contacts list on the left.')
    } catch (err) {
      console.error(err)
      alert('Failed to save contact.')
      setIsSubmitting(false)
    }
  }

  const handleCopyCode = () => {
    if (!generatedCode) return
    navigator.clipboard.writeText(generatedCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact? They will no longer be able to log in.')) return

    try {
      await supabase.from('vibe_contacts').delete().eq('id', id)
      setSelectedContact(null)
      fetchContacts(user.id)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle invitation selections
  const toggleInviteSelection = (contactId: string) => {
    if (invitedContacts.includes(contactId)) {
      setInvitedContacts(invitedContacts.filter(id => id !== contactId))
    } else {
      if (callType === 'p2p_call' && invitedContacts.length >= 1) {
        alert('P2P calls are strictly 1-on-1. Please unselect the current contact first.')
        return
      }
      setInvitedContacts([...invitedContacts, contactId])
    }
  }

  const handleCallTypeChange = (type: 'call' | 'watch_party' | 'p2p_call') => {
    setCallType(type)
    if (type === 'p2p_call' && invitedContacts.length > 1) {
      setInvitedContacts([invitedContacts[0]])
    }
  }

  // Room triggering handler
  const handleStartRoom = async () => {
    if (isStartingRoom || !user) return
    setIsStartingRoom(true)

    try {
      const res = await fetch('/api/vibe/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: callType,
          contactIds: invitedContacts,
          watchUrl: callType === 'watch_party' ? streamUrl.trim() : '',
          displayName: callType === 'watch_party' ? '⚽ Match Party' : callType === 'p2p_call' ? '🔒 1v1 P2P' : '📞 Family Call'
        })
      })

      if (!res.ok) {
        throw new Error('Call creation endpoint returned error')
      }

      const { room: newRoom } = await res.json()
      
      // Redirect Hamid as the host
      const redirectPath = callType === 'watch_party' 
        ? `/vibe/watch/${newRoom.id}` 
        : callType === 'p2p_call'
        ? `/vibe/p2p-room/${newRoom.id}`
        : `/vibe/room/${newRoom.id}`

      router.push(redirectPath)
    } catch (err) {
      console.error('Failed to trigger room:', err)
      alert('Failed to establish room.')
      setIsStartingRoom(false)
    }
  }

  const handleEndActiveRoom = async () => {
    if (!activeRoom || !confirm('Are you sure you want to end this active room session?')) return

    try {
      const res = await fetch('/api/vibe/room', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          roomName: activeRoom.room_name
        })
      })

      if (res.ok) {
        setActiveRoom(null)
        fetchCallLogs()
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0d0d0d] flex items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <DashboardShell profile={profile}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 select-none w-full min-w-0">
        
        {/* Active Session Warning Banner */}
        {activeRoom && (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
              <div>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Call Room Active: {activeRoom.display_name} ({activeRoom.type === 'watch_party' ? 'Watch Party' : activeRoom.type === 'p2p_call' ? 'P2P' : 'Call'})
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Room Name: <code>{activeRoom.room_name}</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.location.href = activeRoom.type === 'watch_party'
                    ? `/vibe/watch/${activeRoom.id}`
                    : activeRoom.type === 'p2p_call'
                    ? `/vibe/p2p-room/${activeRoom.id}`
                    : `/vibe/room/${activeRoom.id}`
                }}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Join Call</span>
              </button>
              <button
                onClick={handleEndActiveRoom}
                className="text-xs bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600 hover:text-white text-rose-500 font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                End Call
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ==================== CONTACTS LIST PANEL (Left Column) ==================== */}
          <div className="lg:col-span-5 bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-900 rounded-3xl overflow-hidden flex flex-col h-[650px] shadow-sm">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-[#fafafa]/50 dark:bg-[#141414]/50">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Friends & Family</h2>
              </div>
              <button
                onClick={openAddModal}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold p-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
              {contacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-center p-6 space-y-2">
                  <span className="text-3xl">👥</span>
                  <p className="text-xs">No contacts registered yet.</p>
                </div>
              ) : (
                contacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedContact(c)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedContact?.id === c.id
                        ? 'bg-purple-500/5 border-purple-500/30'
                        : 'bg-zinc-500/5 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-900/60 hover:bg-zinc-500/10 dark:hover:bg-[#1c1c1c]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-xl shadow"
                        style={{ backgroundColor: c.avatar_color }}
                      >
                        {c.avatar_emoji}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{c.name}</h4>
                        <span className="text-[9px] uppercase font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 px-2 py-0.5 rounded-md mt-1 inline-block">
                          {c.relation}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.is_online ? (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Contact details bottom panel */}
            <AnimatePresence>
              {selectedContact && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-5 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/40 flex flex-col gap-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">Details: {selectedContact.name}</h4>
                      <p className="text-[10px] text-zinc-500">
                        Last seen: {selectedContact.last_seen_at ? new Date(selectedContact.last_seen_at).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteContact(selectedContact.id)}
                      className="text-rose-500 hover:text-rose-400 p-2 hover:bg-rose-500/5 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800/80 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="text-xs font-mono font-semibold select-all text-zinc-700 dark:text-zinc-300">
                        {selectedContact.code}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedContact.code)
                        alert('Code copied to clipboard!')
                      }}
                      className="text-xs text-purple-500 font-bold hover:text-purple-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ==================== RIGHT SIDE PANEL (Call Controls + Recent logs) ==================== */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Call Trigger Box */}
            <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 space-y-5 shadow-sm min-w-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-3 border-b border-zinc-200 dark:border-zinc-900 pb-3 w-full">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 shrink-0">Start Call Room</h3>
                <div className="flex border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-x-auto scrollbar-none p-0.5 w-full sm:w-auto shrink-0 max-w-full">
                  <button
                    onClick={() => handleCallTypeChange('call')}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                      callType === 'call' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Group Call
                  </button>
                  <button
                    onClick={() => handleCallTypeChange('p2p_call')}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                      callType === 'p2p_call' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    1v1 P2P
                  </button>
                  <button
                    onClick={() => handleCallTypeChange('watch_party')}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                      callType === 'watch_party' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Watch Party
                  </button>
                </div>
              </div>

              {/* Contact Multi-Select list */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Select Invitees</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 scrollbar-thin">
                  {contacts.map((c) => {
                    const isSelected = invitedContacts.includes(c.id)
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleInviteSelection(c.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-500/5 border-purple-500/30'
                            : 'bg-zinc-500/5 border-zinc-200 dark:border-zinc-900 hover:bg-zinc-500/10'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate max-w-[120px] text-zinc-800 dark:text-zinc-200">
                          {c.avatar_emoji} {c.name}
                        </span>
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-purple-500" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-400" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Stream URL for watch parties */}
              {callType === 'watch_party' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Stream Video Link</label>
                  <input
                    type="text"
                    placeholder="Enter HLS stream url (.m3u8) or YouTube link..."
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-4 text-xs outline-none focus:border-purple-500/50"
                  />
                </div>
              )}

              {/* Start call room button */}
              <button
                onClick={handleStartRoom}
                disabled={isStartingRoom || invitedContacts.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/20"
              >
                {isStartingRoom ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {callType === 'watch_party' ? <Tv className="h-4 w-4" /> : callType === 'p2p_call' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                    <span>Start {callType === 'watch_party' ? 'Watch Party' : callType === 'p2p_call' ? 'Secure 1v1 P2P' : 'Group Call'} Room</span>
                  </>
                )}
              </button>
            </div>

            {/* Recent logs */}
            <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-900 pb-3">
                <Clock className="h-4 w-4 text-zinc-500" />
                <span>Call Log History</span>
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-900">
                      <th className="text-[10px] uppercase text-zinc-500 pb-2.5 font-bold tracking-wider">Date</th>
                      <th className="text-[10px] uppercase text-zinc-500 pb-2.5 font-bold tracking-wider">Participant</th>
                      <th className="text-[10px] uppercase text-zinc-500 pb-2.5 font-bold tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callLogs.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-zinc-500 text-xs py-8">
                          No recent calls recorded.
                        </td>
                      </tr>
                    ) : (
                      callLogs.map((log) => {
                        const date = new Date(log.joined_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        const durMin = log.duration_seconds 
                          ? `${Math.floor(log.duration_seconds / 60)}m ${log.duration_seconds % 60}s`
                          : 'Ongoing/Failed'
                        
                        return (
                          <tr key={log.id} className="border-b border-zinc-200 dark:border-zinc-900/40 last:border-none">
                            <td className="text-xs py-3 text-zinc-650 dark:text-zinc-400 font-semibold">{date}</td>
                            <td className="text-xs py-3 text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1.5">
                              {log.vibe_contacts ? (
                                <>
                                  <span>{log.vibe_contacts.avatar_emoji}</span>
                                  <span>{log.vibe_contacts.name}</span>
                                </>
                              ) : (
                                <span className="text-zinc-400 font-normal">Unknown</span>
                              )}
                            </td>
                            <td className="text-xs py-3 font-mono text-zinc-500">{durMin}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ==================== ADD CONTACT MODAL DIALOG ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 select-none">
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-[#fafafa]/80 dark:bg-zinc-950/20">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Register New Vibe Contact</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1c1c1c] cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="p-5 space-y-4">
              
              {/* Name field */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bro Salim, Mama, Cousin Ahmed"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-4 text-xs outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Relation selection */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Relation Track</label>
                <select
                  value={newRelation}
                  onChange={(e) => handleRelationChange(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-4 text-xs outline-none focus:border-purple-500/50"
                >
                  <option value="friend">Friend / Colleague</option>
                  <option value="family">Family Member</option>
                  <option value="relative">Relative</option>
                  <option value="other">Other / Guest</option>
                </select>
              </div>

              {/* Preset Emoji Picker Grid */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Select Emoji Avatar</label>
                <div className="grid grid-cols-8 gap-2 p-1.5 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-900">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setSelectedEmoji(e)}
                      disabled={isSubmitting}
                      className={`text-lg p-1.5 rounded-lg transition-all active:scale-[0.88] cursor-pointer ${
                        selectedEmoji === e ? 'bg-purple-600/10 border border-purple-500/30' : 'hover:bg-zinc-200 dark:hover:bg-[#1c1c1c]'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Color Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Avatar Color</label>
                <div className="flex gap-3 justify-center bg-zinc-50 dark:bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-900">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      disabled={isSubmitting}
                      style={{ backgroundColor: c }}
                      className={`h-6 w-6 rounded-full transition-all active:scale-[0.88] cursor-pointer ${
                        selectedColor === c ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-[#121212]' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Generated Code display (editable/copyable only after save) */}
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-900">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Generated Access Code</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl py-3 px-4 border border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold tracking-wide text-zinc-700 dark:text-zinc-300">
                      {generatedCode}
                    </span>
                    {generatedCode && (
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="text-xs text-purple-500 hover:text-purple-400 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit / Save actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-bold py-3 rounded-xl transition-all cursor-pointer text-xs text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Create Contact</span>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </DashboardShell>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit, Trash2, Calendar, Clock, DollarSign,
  Activity, Star, User, Link as LinkIcon, FileText, CheckCircle2,
  Percent, Send, Sparkles, AlertCircle, CheckCircle, Loader2, ChevronRight
} from 'lucide-react'
import MilestoneList from '@/components/dashboard/works/MilestoneList'
import InvoicePanel from '@/components/dashboard/works/InvoicePanel'
import TimeLogPanel from '@/components/dashboard/works/TimeLogPanel'
import ActivityFeed from '@/components/dashboard/works/ActivityFeed'
import AttachmentsList from '@/components/dashboard/works/AttachmentsList'

interface FreelanceProject {
  id: string
  title: string
  track: string
  status: string
  priority: string
  description: string
  due_date: string | null
  estimated_hours: number | null // Used as Budget in OMR or currency
  logged_hours: number
  client_id: string | null
  clients: {
    id: string
    name: string
    company: string
    email?: string
    phone?: string
  } | null
  tags: string[]
  icon: string
  color: string
  progress: number
  computed_progress: number
  project_url: string
  github_url: string
  created_at: string
}

interface Review {
  id: string
  rating: number
  content: string
  status: string
  created_at: string
}

export default function FreelanceProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<FreelanceProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'time' | 'invoices' | 'updates' | 'client' | 'attachments'>('overview')
  const [isRequestingReview, setIsRequestingReview] = useState(false)
  const [reviewStatusText, setReviewStatusText] = useState<string | null>(null)
  const [clientReview, setClientReview] = useState<Review | null>(null)

  // Edit states
  const [isEditingScope, setIsEditingScope] = useState(false)
  const [editedDesc, setEditedDesc] = useState('')
  const [editedUrl, setEditedUrl] = useState('')
  const [editedGithub, setEditedGithub] = useState('')

  useEffect(() => {
    fetchProjectDetail()
    fetchReviewStatus()
  }, [id])

  async function fetchProjectDetail() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/works/${id}`)
      if (res.ok) {
        const { work } = await res.json()
        setProject(work)
        setEditedDesc(work.description || '')
        setEditedUrl(work.project_url || '')
        setEditedGithub(work.github_url || '')
      } else {
        router.push('/works/freelance')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchReviewStatus() {
    try {
      // Check if there is already a review record for this client/work
      const res = await fetch(`/api/works/${id}/send-review`)
      if (res.ok) {
        const data = await res.json()
        if (data.review) {
          setClientReview(data.review)
          if (data.review.status === 'approved') {
            setReviewStatusText('Review submitted & approved!')
          } else if (data.review.status === 'pending') {
            setReviewStatusText(`Review requested on ${new Date(data.review.created_at).toLocaleDateString()}`)
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  async function handleRequestReview() {
    if (!project?.clients?.email || isRequestingReview) return
    setIsRequestingReview(true)
    try {
      const res = await fetch(`/api/works/${id}/send-review`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setReviewStatusText(`Review requested on ${new Date().toLocaleDateString()}`)
        fetchReviewStatus()
      }
    } catch (err) {
      console.error('Failed to request review:', err)
    } finally {
      setIsRequestingReview(false)
    }
  }

  async function handleSaveOverview() {
    try {
      const res = await fetch(`/api/works/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editedDesc,
          project_url: editedUrl,
          github_url: editedGithub
        })
      })
      if (res.ok) {
        setIsEditingScope(false)
        fetchProjectDetail()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    if (!project) return
    try {
      const res = await fetch(`/api/works/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchProjectDetail()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDeleteProject() {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      const res = await fetch(`/api/works/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/works/freelance')
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
        <span className="text-xs font-semibold">Loading project details...</span>
      </div>
    )
  }

  // Days left calculation
  const deadlineDays = project.due_date
    ? Math.ceil((new Date(project.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const currency = project.tags?.[0] || 'OMR'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back link & Title header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push('/works/freelance')}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-650 cursor-pointer self-start transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Freelance</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
              {project.title}
            </h1>
            <p className="text-xs text-zinc-500">
              Project for <span className="font-bold text-zinc-700 dark:text-zinc-300">{project.clients?.name || 'Self / Internal'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status pipeline */}
            <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-xl text-[10px] font-bold">
              {[
                { key: 'backlog', label: 'Lead' },
                { key: 'this_week', label: 'Proposal' },
                { key: 'in_progress', label: 'Active' },
                { key: 'done', label: 'Complete' }
              ].map((step, idx) => (
                <React.Fragment key={step.key}>
                  <button
                    onClick={() => handleUpdateStatus(step.key)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      project.status === step.key
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-650'
                    }`}
                  >
                    {step.label}
                  </button>
                  {idx < 3 && <ChevronRight className="h-3 w-3 text-zinc-300" />}
                </React.Fragment>
              ))}
            </div>

            <button
              onClick={handleDeleteProject}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
              title="Delete Project"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Budget</p>
            <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">
              {project.estimated_hours ? `${project.estimated_hours.toLocaleString()} ${currency}` : 'No Budget'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Progress</p>
            <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">
              {project.computed_progress || project.progress || 0}%
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Deadline</p>
            <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">
              {project.due_date ? new Date(project.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No deadline'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Days Left</p>
            <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">
              {deadlineDays !== null ? (deadlineDays < 0 ? 'Overdue' : `${deadlineDays} days`) : '—'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 rounded-xl">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hours Logged</p>
            <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">
              {project.logged_hours || 0}h
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-900 overflow-x-auto gap-2">
        {(['overview', 'milestones', 'time', 'invoices', 'updates', 'client', 'attachments'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold capitalize border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'border-purple-650 text-purple-650 dark:text-purple-400'
                : 'border-transparent text-zinc-450 hover:text-zinc-650'
            }`}
          >
            {tab === 'time' ? 'Time Log' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>Project Scope & Overview</span>
              </h3>
              {!isEditingScope ? (
                <button
                  onClick={() => setIsEditingScope(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit Overview</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingScope(false)}
                    className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOverview}
                    className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {isEditingScope ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description (Markdown Supported)</label>
                  <textarea
                    value={editedDesc}
                    onChange={e => setEditedDesc(e.target.value)}
                    className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none resize-none focus:border-purple-500"
                    rows={8}
                    placeholder="Describe the scope of work..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Project URL</label>
                    <input
                      type="url"
                      value={editedUrl}
                      onChange={e => setEditedUrl(e.target.value)}
                      className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                      placeholder="https://client-project.com"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">GitHub Repository</label>
                    <input
                      type="url"
                      value={editedGithub}
                      onChange={e => setEditedGithub(e.target.value)}
                      className="w-full mt-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                      placeholder="https://github.com/haaamid/repo"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed whitespace-pre-wrap">
                  {project.description || 'No description or scope of work has been written yet.'}
                </div>

                <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-purple-650 dark:text-purple-400 hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>Live Site</span>
                    </a>
                  )}
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      <span>GitHub Repository</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Client feedback request section */}
            <div className="mt-8 pt-6 border-t border-zinc-150 dark:border-zinc-900">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>Request Client Review</span>
                  </h4>
                  <p className="text-[11px] text-zinc-450">
                    Invite client to review project on haaamid.art. Reviews are stored dynamically in the testimonials directory.
                  </p>
                </div>

                {project.clients?.email ? (
                  <div className="flex items-center gap-3">
                    {reviewStatusText && (
                      <span className="text-[10px] font-bold text-purple-650 bg-purple-500/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>{reviewStatusText}</span>
                      </span>
                    )}

                    <button
                      onClick={handleRequestReview}
                      disabled={isRequestingReview}
                      className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isRequestingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span>Send Request</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-3 py-2 rounded-xl flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>No client email linked</span>
                  </span>
                )}
              </div>

              {clientReview && clientReview.content && (
                <div className="mt-4 p-4 border border-zinc-150 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950 space-y-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: clientReview.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-650 italic leading-relaxed">
                    "{clientReview.content}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <MilestoneList workId={project.id} />
        )}

        {activeTab === 'time' && (
          <TimeLogPanel workId={project.id} estimatedHours={project.estimated_hours || 0} />
        )}

        {activeTab === 'invoices' && (
          <InvoicePanel
            workId={project.id}
            projectTitle={project.title}
            hasClient={!!project.client_id}
            clientEmail={project.clients?.email}
          />
        )}

        {activeTab === 'updates' && (
          <ActivityFeed workId={project.id} />
        )}

        {activeTab === 'client' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <User className="h-4 w-4 text-purple-500" />
              <span>Linked Client Information</span>
            </h3>

            {project.clients ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border border-zinc-100 dark:border-zinc-900 p-4 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Client Name</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{project.clients.name}</p>
                  </div>
                  <div className="border border-zinc-100 dark:border-zinc-900 p-4 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Company</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{project.clients.company || '—'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-zinc-100 dark:border-zinc-900 p-4 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{project.clients.email || '—'}</p>
                  </div>
                  <div className="border border-zinc-100 dark:border-zinc-900 p-4 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Phone Number</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{project.clients.phone || '—'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-zinc-400">
                <p className="font-bold">No client linked</p>
                <p>This project is not linked to any client records.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attachments' && (
          <AttachmentsList workId={project.id} />
        )}
      </div>
    </div>
  )
}

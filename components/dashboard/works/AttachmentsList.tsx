'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Loader2, Link as LinkIcon, FileText, HelpCircle, Upload, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)

const FigmaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
    <path d="M12 9h3.5a3.5 3.5 0 1 1-3.5 3.5V9z" />
    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
  </svg>
)

interface Attachment {
  id: string
  type: 'link' | 'file' | 'figma' | 'github' | 'doc'
  title: string
  url: string
  created_at: string
}

interface AttachmentsListProps {
  workId: string
}

export default function AttachmentsList({ workId }: AttachmentsListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Link form state
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkType, setLinkType] = useState<'link' | 'figma' | 'github' | 'doc'>('link')
  const [isAddingLink, setIsAddingLink] = useState(false)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchAttachments()
  }, [workId])

  async function fetchAttachments() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/works/${workId}/attachments`)
      if (res.ok) {
        const { attachments: data } = await res.json()
        setAttachments(data)
      }
    } catch (err) {
      console.error('Failed to load attachments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-detect link type from URL
  function detectLinkType(url: string): 'figma' | 'github' | 'doc' | 'link' {
    const lower = url.toLowerCase()
    if (lower.includes('github.com')) return 'github'
    if (lower.includes('figma.com')) return 'figma'
    if (lower.includes('docs.google.com') || lower.includes('notion.so') || lower.includes('notion.site')) return 'doc'
    return 'link'
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault()
    if (!linkTitle.trim() || !linkUrl.trim() || isAddingLink) return

    setIsAddingLink(true)
    
    // Auto-detect type if 'link' is selected, to make input easier
    const finalType = linkType === 'link' ? detectLinkType(linkUrl) : linkType

    try {
      const res = await fetch(`/api/works/${workId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: finalType,
          title: linkTitle.trim(),
          url: linkUrl.trim()
        })
      })

      if (res.ok) {
        setLinkTitle('')
        setLinkUrl('')
        setLinkType('link')
        fetchAttachments()
      }
    } catch (err) {
      console.error('Failed to add attachment link:', err)
    } finally {
      setIsAddingLink(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || isUploading) return

    setIsUploading(true)
    try {
      // 1. Upload to Supabase Storage inside the "images" bucket (or create dynamic path)
      const fileExt = file.name.split('.').pop()
      const fileName = `${workId}/${crypto.randomUUID()}.${fileExt}`

      const { data, error: uploadErr } = await supabase.storage
        .from('images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (uploadErr) {
        throw uploadErr
      }

      // 2. Get Public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(data.path)

      const fileUrl = urlData.publicUrl

      // 3. Save attachment record in database
      const res = await fetch(`/api/works/${workId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'file',
          title: file.name,
          url: fileUrl
        })
      })

      if (res.ok) {
        fetchAttachments()
      }
    } catch (err: any) {
      console.error('Failed to upload file:', err)
      alert(`File upload failed: ${err.message || 'Check if "images" bucket exists in Supabase Storage.'}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteAttachment(aid: string) {
    // Optimistic delete
    const updated = attachments.filter(a => a.id !== aid)
    setAttachments(updated)

    try {
      const res = await fetch(`/api/works/${workId}/attachments/${aid}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        fetchAttachments()
      }
    } catch (err) {
      console.error('Failed to delete attachment:', err)
      fetchAttachments()
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case 'github':
        return <GithubIcon className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
      case 'figma':
        return <FigmaIcon className="h-4 w-4" />
      case 'doc':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'file':
        return <FileText className="h-4 w-4 text-emerald-500" />
      default:
        return <LinkIcon className="h-4 w-4 text-zinc-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-xs">Loading attachments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Upload local file */}
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 flex items-center justify-center gap-2 border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-purple-500/50 hover:bg-purple-500/5 py-4 rounded-2xl transition-all text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer disabled:opacity-40"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span>Uploading document...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-purple-600" />
              <span>Upload Document / File</span>
            </>
          )}
        </button>
      </div>

      {/* Add hyperlink form */}
      <form onSubmit={handleAddLink} className="bg-zinc-500/5 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 p-4 rounded-2xl space-y-3">
        <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Add Resource Link</h4>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <input
              type="text"
              placeholder="Title (e.g. Design Spec)"
              required
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              disabled={isAddingLink}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-150 outline-none rounded-xl focus:border-purple-500/50"
            />
          </div>
          <div>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as any)}
              disabled={isAddingLink}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-2 text-xs text-zinc-800 dark:text-zinc-150 outline-none rounded-xl focus:border-purple-500/50 cursor-pointer"
            >
              <option value="link">Auto Detect</option>
              <option value="github">GitHub</option>
              <option value="figma">Figma</option>
              <option value="doc">Document</option>
            </select>
          </div>
        </div>

        <input
          type="url"
          placeholder="URL (e.g. https://...)"
          required
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          disabled={isAddingLink}
          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-150 outline-none rounded-xl focus:border-purple-500/50"
        />

        <button
          type="submit"
          disabled={isAddingLink || !linkTitle || !linkUrl}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40 text-xs flex items-center justify-center gap-1.5"
        >
          {isAddingLink ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Link Attachment</span>
            </>
          )}
        </button>
      </form>

      {/* Attachments list */}
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Attachments</h4>
        
        <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
          {attachments.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No attachment files or resource links added yet.</p>
          ) : (
            attachments.map((item) => (
              <div
                key={item.id}
                className="p-3 border border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/20 rounded-xl flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate">
                      {item.title}
                    </span>
                    <span className="text-[9px] text-zinc-400 capitalize block mt-0.5">
                      {item.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(item.id)}
                    className="p-1 hover:bg-rose-500/10 text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

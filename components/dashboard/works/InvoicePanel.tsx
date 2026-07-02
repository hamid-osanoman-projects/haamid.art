'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus, X, Loader2, Receipt, CheckCircle2, AlertTriangle,
  Send, DollarSign, Calendar, FileText, Download, FileDown
} from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import InvoicePDFTemplate from './InvoicePDFTemplate'
import { createClient } from '@/lib/supabase/client'

interface Invoice {
  id: string
  work_id: string
  user_id: string
  invoice_number: string
  amount: number
  currency: string
  due_date: string | null
  notes: string
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled'
  paid_at: string | null
  created_at: string
  pdf_url?: string | null
}

interface InvoicePanelProps {
  workId: string
  projectTitle: string
  hasClient: boolean
  clientEmail?: string
}

export default function InvoicePanel({ workId, projectTitle, hasClient, clientEmail }: InvoicePanelProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)

  // Create form
  const [newAmount, setNewAmount] = useState('')
  const [newCurrency, setNewCurrency] = useState('OMR')
  const [newDueDate, setNewDueDate] = useState('')
  const [newNotes, setNewNotes] = useState('')

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch(`/api/works/${workId}/invoices`)
      if (res.ok) {
        const { invoices: data } = await res.json()
        setInvoices(data)
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    } finally {
      setIsLoading(false)
    }
  }, [workId])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newAmount || isSaving) return
    setIsSaving(true)

    try {
      const res = await fetch(`/api/works/${workId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(newAmount),
          currency: newCurrency,
          due_date: newDueDate || null,
          notes: newNotes
        })
      })
      if (res.ok) {
        setNewAmount('')
        setNewDueDate('')
        setNewNotes('')
        setIsCreateOpen(false)
        fetchInvoices()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleMarkPaid(invoice: Invoice) {
    setMarkingPaid(invoice.id)
    try {
      const res = await fetch(`/api/works/${workId}/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' })
      })
      if (res.ok) {
        fetchInvoices()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setMarkingPaid(null)
    }
  }

  async function handleSendReminder(invoice: Invoice) {
    if (!hasClient || !clientEmail) return
    setSendingReminder(invoice.id)
    try {
      const res = await fetch(`/api/works/${workId}/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ send_reminder: true })
      })
      if (res.ok) {
        fetchInvoices()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSendingReminder(null)
    }
  }

  async function handleDelete(invoiceId: string) {
    setInvoices(prev => prev.filter(i => i.id !== invoiceId))
    await fetch(`/api/works/${workId}/invoices/${invoiceId}`, { method: 'DELETE' })
  }

  async function generateAndUploadPDF(invoice: Invoice) {
    setGeneratingPdf(invoice.id)
    try {
      // 1. Generate Blob in browser
      const blob = await pdf(<InvoicePDFTemplate 
        invoiceData={{
          invoiceNumber: invoice.invoice_number,
          date: invoice.created_at,
          dueDate: invoice.due_date || '',
          amount: invoice.amount,
          currency: invoice.currency,
          notes: invoice.notes
        }}
        workData={{ title: projectTitle }}
        clientData={hasClient ? { name: 'Client', email: clientEmail } : undefined}
      />).toBlob()

      const supabase = createClient()
      const fileName = `inv_${workId}_${invoice.invoice_number}_${Date.now()}.pdf`
      
      // 2. Upload to Supabase Storage 'invoices' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, blob, { 
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Storage error: ${uploadError.message}`)
      }

      // 3. Get Public URL (assuming the bucket is public, or we just store the path and use signed URLs. We will use publicUrl for simplicity)
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName)

      // 4. Update the DB record with pdf_url
      const res = await fetch(`/api/works/${workId}/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_url: publicUrl })
      })

      if (res.ok) {
        fetchInvoices()
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      alert('Failed to generate PDF. Make sure you created the "invoices" storage bucket.')
    } finally {
      setGeneratingPdf(null)
    }
  }

  // Revenue summary
  const totalAmount = invoices.reduce((s, i) => s + i.amount, 0)
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const outstandingAmount = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const currency = invoices[0]?.currency || 'OMR'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Revenue summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total</p>
          <p className="text-lg font-black text-zinc-800 dark:text-white mt-0.5">
            {totalAmount.toLocaleString()} <span className="text-xs text-zinc-400">{currency}</span>
          </p>
        </div>
        <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Paid</p>
          <p className="text-lg font-black text-green-600 dark:text-green-400 mt-0.5">
            {paidAmount.toLocaleString()} <span className="text-xs">{currency}</span>
          </p>
        </div>
        <div className={`border rounded-xl p-3 text-center ${
          outstandingAmount > 0
            ? 'bg-amber-500/5 border-amber-500/10'
            : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
        }`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${
            outstandingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'
          }`}>Outstanding</p>
          <p className={`text-lg font-black mt-0.5 ${
            outstandingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'
          }`}>
            {outstandingAmount.toLocaleString()} <span className="text-xs">{currency}</span>
          </p>
        </div>
      </div>

      {/* Invoice list */}
      <div className="space-y-2">
        {invoices.map(invoice => {
          const isOverdue = invoice.status === 'unpaid' && invoice.due_date && new Date(invoice.due_date) < new Date()

          return (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl hover:border-purple-500/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  invoice.status === 'paid'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : isOverdue
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {invoice.status === 'paid' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isOverdue ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Receipt className="h-4 w-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Invoice #{invoice.invoice_number}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      invoice.status === 'paid'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : isOverdue
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {isOverdue ? 'OVERDUE' : invoice.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-zinc-450">
                    <span className="font-bold">{invoice.amount.toLocaleString()} {invoice.currency}</span>
                    {invoice.due_date && (
                      <span className="flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" />
                        Due {new Date(invoice.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {invoice.paid_at && (
                      <span className="text-green-600 dark:text-green-400">
                        Paid {new Date(invoice.paid_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {invoice.status !== 'paid' && (
                  <>
                    <button
                      onClick={() => handleMarkPaid(invoice)}
                      disabled={markingPaid === invoice.id}
                      className="text-[10px] font-bold px-2.5 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/20 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {markingPaid === invoice.id ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Mark Paid'}
                    </button>
                    {hasClient && clientEmail && (
                      <button
                        onClick={() => handleSendReminder(invoice)}
                        disabled={sendingReminder === invoice.id}
                        className="text-[10px] font-bold px-2.5 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/20 cursor-pointer transition-all disabled:opacity-50"
                        title="Send payment reminder"
                      >
                        {sendingReminder === invoice.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      </button>
                    )}
                  </>
                )}
                
                {invoice.pdf_url ? (
                  <a
                    href={invoice.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold px-2.5 py-1.5 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-500/20 cursor-pointer transition-all"
                    title="View PDF"
                  >
                    <Download className="h-3 w-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => generateAndUploadPDF(invoice)}
                    disabled={generatingPdf === invoice.id}
                    className="text-[10px] font-bold px-2.5 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
                    title="Generate PDF"
                  >
                    {generatingPdf === invoice.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
                  </button>
                )}

                <button
                  onClick={() => handleDelete(invoice.id)}
                  className="text-[10px] font-bold p-1.5 text-zinc-400 hover:text-red-500 rounded-lg cursor-pointer transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}

        {invoices.length === 0 && (
          <div className="text-center py-10 text-xs text-zinc-400">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
            <p className="font-bold mb-1">No invoices yet</p>
            <p>Create your first invoice for this project.</p>
          </div>
        )}
      </div>

      {/* Create invoice button / form */}
      {isCreateOpen ? (
        <form onSubmit={handleCreate} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Create Invoice</h4>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Amount</label>
              <input
                type="number"
                step="0.01"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                required
                className="w-full mt-1 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition-colors"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Currency</label>
              <select
                value={newCurrency}
                onChange={e => setNewCurrency(e.target.value)}
                className="w-full mt-1 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="OMR">OMR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="AED">AED</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Due Date</label>
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="w-full mt-1 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Notes</label>
            <textarea
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="Optional description or notes..."
              rows={2}
              className="w-full mt-1 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none resize-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={!newAmount || isSaving}
            className="w-full text-xs font-bold py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            <span>Create Invoice</span>
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 rounded-xl cursor-pointer transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Invoice</span>
        </button>
      )}
    </div>
  )
}

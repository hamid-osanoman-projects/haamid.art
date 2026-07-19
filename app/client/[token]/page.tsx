import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { 
  ShieldAlert, Clock, Calendar, CheckCircle2, 
  CircleDashed, ExternalLink, FileText, Download 
} from 'lucide-react';

interface ClientPortalProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ClientPortalPage(props: ClientPortalProps) {
  const params = await props.params;
  const { token } = params;
  const supabase = await createClient();

  // 1. Fetch client by magic link token
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('magic_link_token', token)
    .maybeSingle();

  if (clientError || !client) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white selection:bg-rose-500/30">
        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-8 max-w-md w-full text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-rose-500" />
          <div className="h-20 w-20 bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Invalid or Expired Link</h1>
            <p className="text-xs text-zinc-400">
              This client portal link is not recognized or has expired. Please contact Hamid for a new link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Verify expiry
  const now = new Date();
  const expiresAt = new Date(client.magic_link_expires_at);
  if (now > expiresAt) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white selection:bg-rose-500/30">
        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-8 max-w-md w-full text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-rose-500" />
          <div className="h-20 w-20 bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <Clock className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Link Expired</h1>
            <p className="text-xs text-zinc-400">
              For security, client portal links expire after 30 days. Please request a new link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Fetch associated works (projects)
  const { data: works } = await supabase
    .from('works')
    .select('id, title, status, track, staging_url, created_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false });

  // 3. Fetch associated invoices
  // (We use a try-catch pattern in case the invoices table isn't fully created/populated yet by the user)
  let invoices: any[] = [];
  try {
    const { data: invData } = await supabase
      .from('invoices')
      .select('id, amount, status, created_at, pdf_url')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });
    if (invData) invoices = invData;
  } catch (e) {
    console.warn('Invoices table not available or error fetching');
  }

  const activeWorks = works?.filter(w => w.status === 'in_progress') || [];
  const completedWorks = works?.filter(w => w.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] font-sans selection:bg-purple-500/30 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-12">
        
        {/* Header greeting */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-950/20 px-3 py-1.5 text-xs font-bold text-purple-400 select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Secure Client Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Welcome back, <span className="text-purple-400">{client.name.split(' ')[0]}</span>.
          </h1>
          <p className="text-zinc-400 max-w-xl text-sm leading-relaxed">
            This is your private project dashboard. Track the real-time status of your deliverables, review staging environments, and manage outstanding invoices securely.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column (Projects/Timeline) */}
          <div className="lg:col-span-2 space-y-8">
            
            <section className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                Active Projects
              </h2>
              
              {activeWorks.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
                  <p className="text-sm text-zinc-500">No active projects at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeWorks.map((work) => (
                    <div key={work.id} className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 transition-all hover:border-purple-500/30 group">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg">{work.title}</h3>
                          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Started {new Date(work.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                            <CircleDashed className="h-3 w-3 animate-spin-slow" />
                            In Progress
                          </span>
                        </div>
                      </div>

                      {work.staging_url && (
                        <div className="mt-6 pt-6 border-t border-zinc-800/50">
                          <a 
                            href={work.staging_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            View Live Staging 
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Completed Works
              </h2>
              
              {completedWorks.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
                  <p className="text-sm text-zinc-500">No completed projects yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {completedWorks.map((work) => (
                    <div key={work.id} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5">
                      <h3 className="font-semibold text-zinc-300 text-sm mb-2">{work.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">
                          {new Date(work.created_at).toLocaleDateString()}
                        </span>
                        {work.staging_url && (
                          <a href={work.staging_url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                            View URL
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* Sidebar Column (Invoices & Details) */}
          <div className="space-y-8">
            
            <section className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                Invoices & Billing
              </h3>
              
              {invoices.length === 0 ? (
                <p className="text-xs text-zinc-500">No invoices generated yet.</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex flex-col gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl transition-all hover:bg-zinc-900">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-sm font-bold">${inv.amount?.toLocaleString()}</span>
                          <p className="text-[10px] text-zinc-500">{new Date(inv.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                          inv.status === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      
                      {inv.pdf_url && (
                        <a 
                          href={inv.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors mt-2"
                        >
                          <Download className="h-3 w-3" />
                          Download PDF
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-gradient-to-br from-purple-900/20 to-purple-500/5 border border-purple-500/20 rounded-3xl p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center mx-auto text-purple-400 font-bold text-xl">
                H
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-200">Need Assistance?</h4>
                <p className="text-xs text-zinc-400 mt-1">If you have any questions about your project, please reach out.</p>
              </div>
              <a 
                href="mailto:hamid.codehub@gmail.com" 
                className="inline-block bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider py-2 px-6 rounded-xl transition-all"
              >
                Email Hamid
              </a>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}

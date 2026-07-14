import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { File, Download, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import ClientDownloadButton from './ClientDownloadButton';

interface DropPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DropDownloadPage(props: DropPageProps) {
  const params = await props.params;
  const { id } = params;
  const supabase = await createClient();

  // Fetch record (using single() throws if not found, maybeSingle is safer)
  const { data: dropRecord, error } = await supabase
    .from('file_drops')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !dropRecord) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white selection:bg-rose-500/30">
        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-8 max-w-md w-full text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-rose-500" />
          
          <div className="h-20 w-20 bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Link Expired or Invalid</h1>
            <p className="text-xs text-zinc-400">
              This secure file link does not exist, has expired, or has already been downloaded and destroyed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if expired based on timestamp
  const now = new Date();
  const expiresAt = new Date(dropRecord.expires_at);
  if (now > expiresAt) {
    // We could delete it here, or just show expired. The cron or direct fetch will handle it.
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
              This secure file link has expired and is no longer accessible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fileSizeMB = (dropRecord.file_size_bytes / 1024 / 1024).toFixed(2);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white selection:bg-emerald-500/30">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-8 max-w-md w-full text-center space-y-8 relative overflow-hidden shadow-2xl z-10">
        <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
        
        <div className="space-y-4">
          <div className="h-20 w-20 bg-emerald-950/20 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <File className="h-10 w-10" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-xl font-bold truncate px-4" title={dropRecord.file_name}>
              {dropRecord.file_name}
            </h1>
            <p className="text-xs font-mono text-zinc-500">
              {fileSizeMB} MB
            </p>
          </div>
        </div>

        <div className="bg-emerald-950/10 border border-emerald-500/10 rounded-xl p-4 flex items-start gap-3 text-left">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Burn After Reading</p>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              This is a secure, single-use link. Once you download the file, this link will be permanently destroyed.
            </p>
          </div>
        </div>

        <ClientDownloadButton dropId={dropRecord.id} fileName={dropRecord.file_name} />
        
      </div>
    </div>
  );
}

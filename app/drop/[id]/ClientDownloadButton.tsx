'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';

export default function ClientDownloadButton({ dropId, fileName }: { dropId: string, fileName: string }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setIsDownloading(true);
    setError('');

    try {
      const res = await fetch(`/api/drop/download/${dropId}`, { method: 'POST' });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Download failed');
      }

      const { signedUrl } = await res.json();

      // Trigger actual download
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = fileName; // Note: For cross-origin signed URLs, the browser might ignore this, but Supabase can set download headers
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Reload page to show it has been destroyed
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to download file.');
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-400/50 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
      >
        {isDownloading ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            Decrypting & Downloading...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download File
          </>
        )}
      </button>

      {error && (
        <div className="text-[10px] text-rose-400 font-bold bg-rose-950/20 p-2 rounded border border-rose-500/20">
          {error}
        </div>
      )}
    </div>
  );
}

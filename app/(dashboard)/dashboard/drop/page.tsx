'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, File, Link as LinkIcon, CheckCircle, X, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function FileDropDashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareableLink, setShareableLink] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(10);
    setError('');

    try {
      const supabase = createClient();
      
      // 1. Upload to Supabase Storage client_drops bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `drops/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_drops')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Storage error: ${uploadError.message}. Make sure 'client_drops' bucket exists.`);
      }

      setUploadProgress(60);

      const res = await fetch('/api/drop/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSizeBytes: file.size,
          filePath: filePath,
          mimeType: file.type
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create DB record');
      }

      const { id } = await res.json();
      setUploadProgress(100);
      setShareableLink(`${window.location.origin}/drop/${id}`);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-rose-500" />
          Secure File Drop
        </h1>
        <p className="text-xs text-zinc-500">
          Upload files to generate "Burn After Reading" single-use client links.
        </p>
      </div>

      {!shareableLink ? (
        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer
              ${isDragging 
                ? 'border-rose-500 bg-rose-500/5' 
                : file 
                  ? 'border-emerald-500/30 bg-emerald-500/5' 
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900'
              }
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
            />
            
            {file ? (
              <div className="space-y-4">
                <div className="h-16 w-16 bg-emerald-950/30 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                  <File className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-400">{file.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-rose-400 px-3 py-1 rounded bg-zinc-900"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-16 w-16 bg-zinc-900 text-zinc-500 rounded-2xl flex items-center justify-center mx-auto border border-zinc-800">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Drag & drop your file here</p>
                  <p className="text-xs text-zinc-500 mt-1">or click to browse from your computer</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg text-xs text-rose-400 font-medium">
              {error}
            </div>
          )}

          {file && (
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 disabled:text-rose-400/50 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Encrypting & Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Generate Burn-Link
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-emerald-900/30 rounded-2xl p-8 text-center space-y-6">
          <div className="h-20 w-20 bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Link Generated!</h2>
            <p className="text-xs text-zinc-400">
              This is a single-use link. The moment it is downloaded, the file and record will self-destruct permanently.
            </p>
          </div>

          <div className="flex items-center gap-2 max-w-lg mx-auto bg-black border border-zinc-800 p-2 rounded-xl">
            <div className="flex-1 px-3 py-2 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-nowrap scrollbar-none">
              {shareableLink}
            </div>
            <button 
              onClick={copyLink}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
            >
              <LinkIcon className="h-3 w-3" />
              Copy
            </button>
          </div>

          <button 
            onClick={() => {
              setFile(null);
              setShareableLink('');
              setUploadProgress(0);
            }}
            className="text-xs text-zinc-500 hover:text-white transition-colors pt-4 font-medium"
          >
            Upload another file
          </button>
        </div>
      )}
    </div>
  );
}

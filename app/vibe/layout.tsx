import { Metadata } from 'next';
import React from 'react';
import PwaInstallPrompt from '@/components/vibe/PwaInstallPrompt';

export const metadata: Metadata = {
  manifest: '/api/manifest/vibe',
};

export default function VibeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="vibe-layout-wrapper w-full h-full relative">
      {children}
      <PwaInstallPrompt />
    </div>
  );
}

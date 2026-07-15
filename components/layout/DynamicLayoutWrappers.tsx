"use client";
import dynamic from 'next/dynamic';

export const MusicPlayer = dynamic(() => import("@/components/ui/MusicPlayer"), { ssr: false });
export const VoiceController = dynamic(() => import("@/components/gamification/VoiceController"), { ssr: false });
export const MouseTrail = dynamic(() => import("@/components/layout/MouseTrail"), { ssr: false });
export const MaintenanceListener = dynamic(() => import("@/components/layout/MaintenanceListener"), { ssr: false });

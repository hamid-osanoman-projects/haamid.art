'use client';
import dynamic from 'next/dynamic';

export const TerminalOverlay = dynamic(() => import('./TerminalOverlay'), { ssr: false });
export const AsciiOverlay = dynamic(() => import('./AsciiOverlay'), { ssr: false });
export const LightsOutOverlay = dynamic(() => import('./LightsOutOverlay'), { ssr: false });
export const PhysicsSandbox = dynamic(() => import('./PhysicsSandbox'), { ssr: false });
export const JengaPlayground = dynamic(() => import('./JengaPlayground'), { ssr: false });
export const GravityPlayground = dynamic(() => import('./GravityPlayground'), { ssr: false });
export const AsciiArtGenerator = dynamic(() => import('./AsciiArtGenerator'), { ssr: false });


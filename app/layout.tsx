import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TrackerProvider from "@/components/gamification/TrackerProvider";
import AskHamidWidget from "@/components/ai/AskHamidWidget";
import { TerminalOverlay, AsciiOverlay, LightsOutOverlay } from "@/components/easteregg/DynamicWrappers";
import { MusicPlayer, VoiceController, MouseTrail, MaintenanceListener } from "@/components/layout/DynamicLayoutWrappers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://haaamid.art'),
  title: {
    default: 'Hamid U V · Web & Software Developer',
    template: '%s · Hamid U V'
  },
  description: 'Hamid U V — web & software developer crafting fast, beautiful digital products. Based in Muscat, Oman. Available for freelance.',
  keywords: [
    'Hamid U V', 'haaamid', 'haaamid.art',
    'web developer Oman', 'software developer Muscat',
    'freelance developer Oman', 'Next.js developer',
    'React developer', 'Supabase developer',
    'full stack developer portfolio', 'vibe coding developer'
  ],
  authors: [{ name: 'Hamid U V', url: 'https://haaamid.art' }],
  creator: 'Hamid U V',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://haaamid.art',
    siteName: 'Hamid U V',
    title: 'Hamid U V · Web & Software Developer',
    description: 'Building fast, beautiful web products. Based in Muscat, Oman.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Hamid U V — Web & Software Developer' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hamid U V · Web & Software Developer',
    description: 'Building fast, beautiful web products. Based in Oman.',
    images: ['/og-image.png'],
    creator: '@yourtwitterhandle'
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://haaamid.art' }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // Fetch global settings
  let settings = {
    easter_eggs_enabled: true,
    maintenance_mode: false,
    force_dark_mode: false
  };

  try {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await adminSupabase
      .from('global_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (data) {
      settings = data;
    }
  } catch (err) {
    // ignore
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${settings.force_dark_mode ? 'dark' : ''}`}
    >
      <body className="min-h-full flex flex-col">
        <MaintenanceListener />
        <TrackerProvider>
          {children}
          <AskHamidWidget />
          {settings.easter_eggs_enabled && (
            <>
              <TerminalOverlay />
              <AsciiOverlay />
              <LightsOutOverlay />
              <MusicPlayer />
              <VoiceController />
              <MouseTrail />
            </>
          )}
        </TrackerProvider>
      </body>
    </html>
  );
}

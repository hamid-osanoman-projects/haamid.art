import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: "HIVE",
    short_name: "HIVE",
    description: "Hamid Art Admin Dashboard",
    start_url: "/dashboard",
    scope: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#9333ea",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };

  return NextResponse.json(manifest);
}

import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: "NOOK",
    short_name: "NOOK",
    description: "Hamid Art Vibe Calling",
    start_url: "/vibe",
    scope: "/vibe",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#10b981",
    icons: [
      {
        src: "/icon-vibe-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-vibe-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };

  return NextResponse.json(manifest);
}

'use client';

import { useEffect, useState } from 'react';
import AsciiArtGenerator from './AsciiArtGenerator';

/**
 * Mounts the ASCII Art Generator as a fullscreen overlay.
 * Opens when window fires the custom event "vibe:open-ascii".
 * Lives in the root layout alongside TerminalOverlay.
 */
export default function AsciiOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('vibe:open-ascii', handler);
    return () => window.removeEventListener('vibe:open-ascii', handler);
  }, []);

  if (!open) return null;

  return <AsciiArtGenerator standalone={false} onClose={() => setOpen(false)} />;
}

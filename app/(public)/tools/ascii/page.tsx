import type { Metadata } from 'next';
import { AsciiArtGenerator } from '@/components/easteregg/DynamicWrappers';

export const metadata: Metadata = {
  title: 'ASCII Art Generator',
  description: 'Convert any image to ASCII art. Free online tool by Hamid U V. Supports custom resolution, color themes, invert mode, and PNG export.',
};

export default function AsciiArtPage() {
  return <AsciiArtGenerator standalone={true} />;
}

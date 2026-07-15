import type { Metadata } from 'next';
import { JengaPlayground } from '@/components/easteregg/DynamicWrappers';

export const metadata: Metadata = {
  title: 'Tech Stack Jenga',
  description: 'Interactive physics-based tech stack tower builder by Hamid U V.',
};

export default function JengaPage() {
  return <JengaPlayground />;
}

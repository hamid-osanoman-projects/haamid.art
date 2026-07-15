import type { Metadata } from 'next';
import { GravityPlayground } from '@/components/easteregg/DynamicWrappers';

export const metadata: Metadata = {
  title: 'Zero-G Physics Playground',
  description: 'Interactive anti-gravity developer physics playground by Hamid U V.',
};

export default function GravityPage() {
  return <GravityPlayground />;
}

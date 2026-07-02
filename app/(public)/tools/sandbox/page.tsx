import type { Metadata } from 'next';
import PhysicsSandbox from '@/components/easteregg/PhysicsSandbox';

export const metadata: Metadata = {
  title: 'Physics Sandbox',
  description: 'Interactive physics sandbox with explosives, anvils, and bouncy balls by Hamid U V.',
};

export default function SandboxPage() {
  return <PhysicsSandbox />;
}

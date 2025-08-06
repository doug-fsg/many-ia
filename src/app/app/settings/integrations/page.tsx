import { Metadata } from 'next';
import { IntegrationsGrid } from './_components/integrations-grid';
import { IntegrationsHeader } from './_components/integrations-header';

export const metadata: Metadata = {
  title: 'Integrações',
  description: 'Gerencie todas as integrações do seu agente de IA.',
};

export default function IntegrationsPage() {
  return (
    <div className="container max-w-5xl py-6 space-y-8">
      <IntegrationsHeader />
      <IntegrationsGrid />
    </div>
  );
} 
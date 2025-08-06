'use client';

import { MessagesSquareIcon, BrainCircuitIcon } from 'lucide-react';
import { IntegrationCard } from './integration-card';
import Image from 'next/image';

const GoogleCalendarIcon = () => (
  <Image
    src="/images/Google_Calendar.svg"
    alt="Google Calendar"
    width={24}
    height={24}
    className="h-6 w-6"
  />
);

const integrations = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Conecte sua conta para permitir agendamento automático.',
    icon: GoogleCalendarIcon,
    status: 'available',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Em breve: Integre seu agente com o WhatsApp Business API.',
    icon: MessagesSquareIcon,
    status: 'coming-soon',
  },
  {
    id: 'custom-ai',
    name: 'Modelos de IA Personalizados',
    description: 'Em breve: Use seus próprios modelos de IA treinados.',
    icon: BrainCircuitIcon,
    status: 'coming-soon',
  },
] as const;

export function IntegrationsGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
        />
      ))}
    </div>
  );
} 
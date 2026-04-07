'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GoogleCalendarStatus } from './google-calendar-status';

interface IntegrationCardProps {
  integration: {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon | React.ComponentType;
    status: 'available' | 'coming-soon';
  };
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const Icon = integration.icon;

  return (
    <Card className="relative overflow-hidden group">
      {integration.status === 'coming-soon' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Badge variant="secondary" className="text-sm">
            Em breve
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Icon className={integration.id === 'google-calendar' ? '' : 'h-6 w-6'} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{integration.name}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription>{integration.description}</CardDescription>

        {integration.id === 'google-calendar' && integration.status === 'available' && (
          <GoogleCalendarStatus />
        )}
      </CardContent>
    </Card>
  );
} 
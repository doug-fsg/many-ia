'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { GoogleCalendarConfigDialog } from './google-calendar-config-dialog';

interface GoogleCalendarIntegration {
  id: string;
  email: string;
  calendarId: string | null;
  createdAt: string;
}

interface AIConfig {
  googleCalendarEnabled: boolean;
  defaultEventDuration: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  allowedDays: string[];
  minAdvanceTime: number;
  maxAdvanceTime: number;
  defaultReminder: number;
  autoCreateEvents: boolean;
}

export function GoogleCalendarStatus() {
  const [integration, setIntegration] = useState<GoogleCalendarIntegration | null>(null);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchIntegrationStatus = async () => {
    setIsLoading(true);
    try {
      // Buscar status da integração
      const integrationResponse = await fetch('/api/integrations/google-calendar/status');
      if (integrationResponse.ok) {
        const integrationData = await integrationResponse.json();
        setIntegration(integrationData.integration);

        // Se houver integração, buscar configurações
        if (integrationData.integration) {
          const configResponse = await fetch('/api/integrations/google-calendar/config');
          if (configResponse.ok) {
            const configData = await configResponse.json();
            setConfig(configData.config);
          }
        }
      } else {
        throw new Error('Falha ao buscar status');
      }
    } catch (error) {
      console.error('Erro ao buscar status da integração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar o status da integração.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  // Conectar com Google Calendar
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      router.push('/api/integrations/google-calendar/auth');
    } catch (error) {
      console.error('Erro ao conectar com Google Calendar:', error);
      setIsConnecting(false);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a conexão com Google Calendar.',
        variant: 'destructive',
      });
    }
  };

  // Desconectar do Google Calendar
  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      const response = await fetch('/api/integrations/google-calendar/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setIntegration(null);
        setConfig(null);
        toast({
          title: 'Desconectado',
          description: 'Integração com Google Calendar removida com sucesso.',
        });
      } else {
        throw new Error('Falha ao desconectar');
      }
    } catch (error) {
      console.error('Erro ao desconectar Google Calendar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desconectar do Google Calendar.',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Verificando status...</span>
      </div>
    );
  }

  if (integration) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>
            Conectado como <strong>{integration.email}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Desconectando...
              </>
            ) : (
              'Desconectar'
            )}
          </Button>
        </div>

        <GoogleCalendarConfigDialog 
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          defaultValues={config}
          onSuccess={() => console.log('Configurações salvas com sucesso')}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <XCircle className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Não conectado</span>
      </div>
      <Button
        size="sm"
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Conectando...
          </>
        ) : (
          'Conectar Google Calendar'
        )}
      </Button>
    </div>
  );
} 
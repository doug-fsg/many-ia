'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import useSWR from 'swr';

interface GoogleCalendarIntegration {
  id: string;
  email: string;
  calendarId: string | null;
  createdAt: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao buscar status');
  return res.json();
};

export function GoogleCalendarStatus() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR(
    '/api/integrations/google-calendar/status',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 300000, // 5 minutos
    }
  );

  const integration = data?.integration;

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
        await mutate(); // Atualiza o cache
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verificando status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            <span>Erro ao verificar status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {integration ? (
              <>
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                <p className="text-sm">
                  Conectado como {integration.email}
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Desconectado
                </p>
              </>
            )}
          </div>
          {integration ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="w-full"
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
          ) : (
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
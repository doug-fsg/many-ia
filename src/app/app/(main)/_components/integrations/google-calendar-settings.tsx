'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { GoogleCalendarConfigDialog } from './google-calendar-config-dialog';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GoogleCalendarConfig {
  googleCalendarEnabled: boolean;
  calendarId: string | null;
  defaultEventDuration: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  allowedDays: string[];
  minAdvanceTime: number;
  maxAdvanceTime: number;
  defaultReminder: number | null;
  reminderMessage?: string;
  autoCreateEvents: boolean;
}

interface GoogleCalendarIntegration {
  id: string;
  email: string;
  calendarId: string | null;
  createdAt: string;
}

function ConfigureButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClick}
              type="button"
              disabled={disabled}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </span>
        </TooltipTrigger>
        {disabled && (
          <TooltipContent>
            <p>Conecte sua conta do Google Calendar em Configurações &gt; Integrações antes de configurar o agendamento automático</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function GoogleCalendarSettings({ 
  form,
  defaultConfig 
}: { 
  form: any;
  defaultConfig?: GoogleCalendarConfig;
}) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [hasIntegration, setHasIntegration] = useState(false);
  const [googleCalendarConfig, setGoogleCalendarConfig] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkIntegration = async () => {
      try {
        const statusResponse = await fetch('/api/integrations/google-calendar/status');
        const statusData = await statusResponse.json();
        setHasIntegration(!!statusData.integration);
        // Se estiver editando, já busca as configs do backend
        if (statusData.integration) {
            const configResponse = await fetch('/api/integrations/google-calendar/config');
          if (configResponse.ok) {
            const configData = await configResponse.json();
            if (configData?.config) {
              setGoogleCalendarConfig(configData.config);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações do Google Calendar',
          variant: 'destructive'
        });
      }
    };
    checkIntegration();
  }, []);
    
  // Atualiza os campos do formulário principal diretamente
  const handleConfigUpdate = (newConfig: GoogleCalendarConfig) => {
    Object.entries(newConfig).forEach(([key, value]) => {
      if (form.getFieldState(key)) {
        form.setValue(key, value, { shouldDirty: true });
      }
    });
  };

  // Salva alterações (neste fluxo, basta aplicar temporariamente, pois o form já está sincronizado)
  const saveChanges = () => {
    toast({
      title: 'Configurações salvas',
      description: 'As configurações do Google Calendar foram salvas com sucesso.',
    });
  };

  // Ao abrir o modal, buscar as configs mais recentes do backend
  const handleOpenModal = async () => {
    setIsConfigOpen(true);
    try {
      const configResponse = await fetch('/api/integrations/google-calendar/config');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        if (configData?.config) {
          setGoogleCalendarConfig(configData.config);
        }
      }
    } catch (error) {
      // Silencioso, já há toast global
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
            <Image
              src="/images/Google_Calendar.svg"
              alt="Google Calendar"
              width={24}
              height={24}
              className="h-6 w-6"
            />
          </div>
          <div>
            <h3 className="font-medium flex items-center gap-2">
              Google Calendar
              {form.watch('googleCalendarEnabled') && (
                <Badge className="bg-green-600 text-white text-xs font-medium px-2 py-0.5 rounded ml-2" style={{lineHeight: '1.2', letterSpacing: '0.02em'}}>Ativo</Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {form.watch('googleCalendarEnabled') 
                ? 'Configurações do agendamento automático'
                : 'Configure o agendamento automático'}
            </p>
          </div>
        </div>
        <ConfigureButton 
          onClick={handleOpenModal} 
          disabled={!hasIntegration}
        />
      </div>

      <GoogleCalendarConfigDialog 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        defaultValues={googleCalendarConfig || form.getValues()}
        onSuccess={handleConfigUpdate}
      />

      {/* O botão "Salvar Alterações" agora é desnecessário, pois o form já está sincronizado */}
    </div>
  );
} 
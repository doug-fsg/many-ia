'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Section } from '@/components/ui/section';
import { GoogleCalendarCreateCalendarDialog } from './google-calendar-create-calendar-dialog';
import { 
  Plus, 
  RefreshCw, 
  SmilePlus, 
  Loader2, 
  Settings, 
  Clock, 
  Bell, 
  Calendar as CalendarIcon,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import * as z from 'zod';

const googleCalendarConfigSchema = z.object({
  googleCalendarEnabled: z.boolean().default(false),
  calendarId: z.string().optional(),
  defaultEventDuration: z.number().min(30).max(120).optional(),
  weeklySchedule: z.record(z.object({
    enabled: z.boolean().default(true),
    start: z.string().refine(val => val === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), 'Formato inválido de hora').optional(),
    end: z.string().refine(val => val === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), 'Formato inválido de hora').optional(),
    hasBreak: z.boolean().default(false),
    breakStart: z.string().refine(val => val === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), 'Formato inválido de hora').optional(),
    breakEnd: z.string().refine(val => val === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val), 'Formato inválido de hora').optional(),
  })).optional(),
  minAdvanceTime: z.number().min(0).max(24).optional(),
  maxAdvanceTime: z.number().min(1).max(90).optional(),
  defaultReminder: z.number().min(0).max(1440).nullable(),
  reminderMessage: z.string().max(500, 'A mensagem deve ter no máximo 500 caracteres').optional(),
  autoCreateEvents: z.boolean().default(false),
  eventType: z.enum(['video_call', 'presencial']).default('video_call'),
  responsibleEmails: z.array(z.string().email('Email inválido')).default([]),
  aiPrompt: z.string().max(1000, 'O prompt deve ter no máximo 1000 caracteres').optional(),
  enableScarcityMode: z.boolean().default(false),
  maxSlotsToShow: z.number().min(1).max(50).optional(),
});

const diasDaSemana = [
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
  { value: '0', label: 'Domingo' },
];

const duracoesPadrao = [
  { value: '30', label: '30 minutos' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1 hora e 30 minutos' },
  { value: '120', label: '2 horas' },
];

// Função para gerar horário padrão da semana - TODOS INATIVOS SEM HORÁRIOS
const generateDefaultWeeklySchedule = () => {
  const schedule: any = {};
  diasDaSemana.forEach(dia => {
    schedule[dia.value] = {
      enabled: false, // Todos inativos por padrão
      start: '', // Sem horário pré-definido
      end: '', // Sem horário pré-definido
      hasBreak: false,
      breakStart: '',
      breakEnd: '',
    };
  });
  return schedule;
};

const lembretes = [
  { value: 'disabled', label: 'Desativado' },
  { value: '10', label: '10 minutos antes' },
  { value: '30', label: '30 minutos antes' },
  { value: '60', label: '1 hora antes' },
  { value: '1440', label: '1 dia antes' },
];

const templatesMensagem = [
  {
    id: 'party',
    icon: '🎉',
    text: 'Lembrete: Sua reunião está próxima! \n{link}',
    description: 'Tom festivo e animado'
  },
  {
    id: 'alarm',
    icon: '⏰',
    text: 'Olá {nome}, não esqueça do seu compromisso amanhã! \n{data} {hora}\n{link}',
    description: 'Lembrete direto e claro'
  },
  {
    id: 'star',
    icon: '✨',
    text: 'Estamos aguardando você para nosso encontro! \n{data} {hora}\n{link}',
    description: 'Tom acolhedor e pessoal'
  },
  {
    id: 'calendar',
    icon: '📅',
    text: 'Confirmação: Seu horário está agendado para {data} às {hora}\n{link}',
    description: 'Com informações específicas'
  }
];

const tiposEvento = [
  { value: 'video_call', label: 'Chamada de Vídeo', icon: '📹' },
  { value: 'presencial', label: 'Reunião Presencial', icon: '🏢' }
];

interface Calendar {
  id: string;
  name: string;
  primary?: boolean;
  description?: string;
}

interface GoogleCalendarConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultValues?: any;
  onSuccess?: (data: any) => void;
}

export function GoogleCalendarConfigDialog({
  isOpen,
  onClose,
  defaultValues,
  onSuccess,
}: GoogleCalendarConfigDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isCreateCalendarOpen, setIsCreateCalendarOpen] = useState(false);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Verificar se o usuário tem integração ativa
  useEffect(() => {
    fetch('/api/integrations/google-calendar/status')
      .then(response => response.json())
      .then(data => {
        // setHasIntegration(!!data.integration); // This state is no longer needed
      })
      .catch(error => {
        console.error('Erro ao verificar integração:', error);
      });
  }, []);

  // Carregar lista de calendários
  const loadCalendars = async () => {
    try {
      setIsLoadingCalendars(true);
      setCalendarError(null);
      const response = await fetch('/api/integrations/google-calendar/calendars');
      const data = await response.json();

      if (!response.ok) {
        // Verificar se é erro de reconexão necessária
        if (data.error === 'REAUTH_REQUIRED' || data.requiresReauth) {
          const errorMessage = data.message || 'Sessão expirada. Por favor, reconecte sua conta do Google Calendar.';
          setCalendarError(errorMessage);
          toast({
            title: 'Reconexão Necessária',
            description: errorMessage + ' Acesse Configurações > Integrações para reconectar.',
            variant: 'destructive',
          });
          return;
        }
        throw new Error(data.message || data.error || 'Erro ao carregar calendários');
      }

      if (data.calendars) {
        setCalendars(data.calendars);
      }
    } catch (error: any) {
      console.error('Erro ao carregar calendários:', error);
      const errorMessage = error.message || 'Não foi possível carregar a lista de calendários.';
      setCalendarError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // Carregar calendários quando o diálogo abrir
  useEffect(() => {
    if (isOpen) {
      loadCalendars();
    }
  }, [isOpen]);

  const form = useForm({
    resolver: zodResolver(googleCalendarConfigSchema),
    defaultValues: {
      googleCalendarEnabled: defaultValues?.googleCalendarEnabled ?? false,
      calendarId: defaultValues?.calendarId ?? '',
      defaultEventDuration: defaultValues?.defaultEventDuration ?? 60,
      weeklySchedule: defaultValues?.weeklySchedule ?? generateDefaultWeeklySchedule(),
      minAdvanceTime: defaultValues?.minAdvanceTime ?? 1,
      maxAdvanceTime: defaultValues?.maxAdvanceTime ?? 30,
      defaultReminder: defaultValues?.defaultReminder ?? null,
      reminderMessage: defaultValues?.reminderMessage ?? '',
      autoCreateEvents: defaultValues?.autoCreateEvents ?? false,
      eventType: defaultValues?.eventType ?? 'video_call',
      responsibleEmails: defaultValues?.responsibleEmails ?? [],
      aiPrompt: defaultValues?.aiPrompt ?? '',
      enableScarcityMode: defaultValues?.enableScarcityMode ?? false,
      maxSlotsToShow: defaultValues?.maxSlotsToShow ?? 5,
    },
  });

  // Atualiza o formulário APENAS na primeira abertura ou quando defaultValues mudar
  useEffect(() => {
    if (isOpen && defaultValues) {
      const resetData = {
        googleCalendarEnabled: defaultValues.googleCalendarEnabled ?? false,
        calendarId: defaultValues.calendarId ?? '',
        defaultEventDuration: defaultValues.defaultEventDuration ?? 60,
        weeklySchedule: defaultValues.weeklySchedule ?? generateDefaultWeeklySchedule(),
        minAdvanceTime: defaultValues.minAdvanceTime ?? 1,
        maxAdvanceTime: defaultValues.maxAdvanceTime ?? 30,
        defaultReminder: defaultValues.defaultReminder ?? null,
        reminderMessage: defaultValues.reminderMessage ?? '',
        autoCreateEvents: defaultValues.autoCreateEvents ?? false,
        eventType: defaultValues.eventType ?? 'video_call',
        responsibleEmails: defaultValues.responsibleEmails ?? [],
        aiPrompt: defaultValues.aiPrompt ?? '',
        enableScarcityMode: defaultValues.enableScarcityMode ?? false,
        maxSlotsToShow: defaultValues.maxSlotsToShow ?? 5,
      };
      
      form.reset(resetData);
    }
  }, [isOpen, defaultValues, form]);

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      
      // Apenas formata os dados e passa para o componente pai - SEM valores padrão forçados
      const formattedData = {
        googleCalendarEnabled: Boolean(data.googleCalendarEnabled),
        calendarId: data.calendarId || '',
        defaultEventDuration: parseInt(data.defaultEventDuration) || 60,
        weeklySchedule: data.weeklySchedule || generateDefaultWeeklySchedule(),
        minAdvanceTime: parseInt(data.minAdvanceTime) || 1,
        maxAdvanceTime: parseInt(data.maxAdvanceTime) || 30,
        defaultReminder: data.defaultReminder === 'disabled' || !data.defaultReminder ? null : parseInt(data.defaultReminder),
        reminderMessage: data.reminderMessage || '',
        autoCreateEvents: Boolean(data.autoCreateEvents),
        eventType: data.eventType || 'video_call',
        responsibleEmails: Array.isArray(data.responsibleEmails) ? data.responsibleEmails : [],
        aiPrompt: data.aiPrompt || '',
        enableScarcityMode: Boolean(data.enableScarcityMode),
        maxSlotsToShow: data.enableScarcityMode ? (parseInt(data.maxSlotsToShow) || 5) : undefined,
      };
      
      // Atualiza apenas o formulário local (não salva no backend)
      if (onSuccess) {
        onSuccess(formattedData);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Erro ao processar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Configurações do Google Calendar</DialogTitle>
            <DialogDescription>
              Configure os horários e lembretes para agendamento automático no Google Calendar
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-1">
                <form 
                  onSubmit={form.handleSubmit(onSubmit, (errors) => {
                      console.log('Erros de validação no modal:', errors);
                      const errorMessages = Object.entries(errors).map(([field, error]: [string, any]) => {
                        if (error.message) return `${field}: ${error.message}`;
                        return field;
                      }).join(', ');
                      toast({
                        title: 'Erro de validação',
                        description: `Corrija os seguintes campos: ${errorMessages}`,
                        variant: 'destructive',
                      });
                    })}
                  className="space-y-6 h-full"
                >
              {/* Toggle principal para ativar/desativar */}
              <FormField
                control={form.control}
                name="googleCalendarEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativar Agendamento</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Tabs defaultValue="geral" className="w-full h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
                    <TabsTrigger value="geral" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Settings className="h-4 w-4" />
                      Geral
                    </TabsTrigger>
                    <TabsTrigger value="horarios" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Clock className="h-4 w-4" />
                      Horários
                    </TabsTrigger>
                    <TabsTrigger value="lembretes" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Bell className="h-4 w-4" />
                      Lembretes
                    </TabsTrigger>
                    <TabsTrigger value="avancado" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Settings className="h-4 w-4" />
                      Avançado
                    </TabsTrigger>
                  </TabsList>

                  {/* Aba Geral */}
                  <TabsContent value="geral" className="flex-1 overflow-y-auto space-y-6 mt-6">
                    <Section 
                      title="Configurações Gerais" 
                      icon={<CalendarIcon className="h-4 w-4 text-primary" />}
                    >
                    <FormField
                      control={form.control}
                      name="calendarId"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Agenda</FormLabel>
                          <div className="flex gap-2">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoadingCalendars}
                            >
                              <FormControl>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Selecione uma agenda" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {calendars.length === 0 && !isLoadingCalendars && !calendarError && (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    Nenhuma agenda encontrada
                                  </div>
                                )}
                                {calendars.map((calendar) => (
                                  <SelectItem key={calendar.id} value={calendar.id}>
                                    {calendar.name} {calendar.primary && '(Principal)'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setIsCreateCalendarOpen(true)}
                              disabled={isLoadingCalendars}
                              title="Criar nova agenda"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={loadCalendars}
                              disabled={isLoadingCalendars}
                              title="Recarregar agendas"
                            >
                              <RefreshCw className={cn(
                                "h-4 w-4",
                                isLoadingCalendars && "animate-spin"
                              )} />
                            </Button>
                          </div>
                          {calendarError && (
                            <p className="text-sm text-destructive mt-2">
                              {calendarError}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  <FormField
                    control={form.control}
                    name="defaultEventDuration"
                    render={({ field }) => (
                      <FormItem>
                            <FormLabel>Duração</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                                  <SelectValue placeholder="Selecione a duração" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {duracoesPadrao.map((duracao) => (
                              <SelectItem key={duracao.value} value={duracao.value}>
                                {duracao.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                      <FormField
                        control={form.control}
                        name="eventType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Evento</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tiposEvento.map((tipo) => (
                                  <SelectItem key={tipo.value} value={tipo.value}>
                                    <div className="flex items-center gap-2">
                                      <span>{tipo.icon}</span>
                                      <span>{tipo.label}</span>
                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="responsibleEmails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsáveis</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Digite um email..."
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.target as HTMLInputElement;
                                        const email = input.value.trim();
                                        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                                          if (!field.value.includes(email)) {
                                            field.onChange([...field.value, email]);
                                          }
                                          input.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      const input = document.querySelector('input[placeholder="Digite um email..."]') as HTMLInputElement;
                                      const email = input?.value.trim();
                                      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                                        if (!field.value.includes(email)) {
                                          field.onChange([...field.value, email]);
                                        }
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    Adicionar
                                  </Button>
                                </div>
                                {field.value.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {field.value.map((email: string, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                                      >
                                        <span>{email}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            field.onChange(field.value.filter((_: string, i: number) => i !== index));
                                          }}
                                          className="text-primary/70 hover:text-primary"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Section>

                    <Section 
                      title="Antecedência" 
                      icon={<Clock className="h-4 w-4 text-primary" />}
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="minAdvanceTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mínima</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">Imediato</SelectItem>
                                  <SelectItem value="1">1 hora</SelectItem>
                                  <SelectItem value="2">2 horas</SelectItem>
                                  <SelectItem value="4">4 horas</SelectItem>
                                  <SelectItem value="8">8 horas</SelectItem>
                                  <SelectItem value="24">1 dia</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxAdvanceTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Máxima</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="7">7 dias</SelectItem>
                                  <SelectItem value="15">15 dias</SelectItem>
                                  <SelectItem value="30">30 dias</SelectItem>
                                  <SelectItem value="60">60 dias</SelectItem>
                                  <SelectItem value="90">90 dias</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Section>
                  </TabsContent>

                  {/* Aba Horários */}
                  <TabsContent value="horarios" className="flex-1 overflow-y-auto space-y-6 mt-6">
                    <Section 
                      title="Horários por Dia da Semana" 
                      icon={<Clock className="h-4 w-4 text-primary" />}
                    >
                    <div className="grid gap-4">
                      {diasDaSemana.map((dia) => {
                        const watchedValue = form.watch(`weeklySchedule.${dia.value}`);
                        const daySchedule = watchedValue ? {
                          enabled: watchedValue.enabled ?? false,
                          start: watchedValue.start ?? '',
                          end: watchedValue.end ?? '',
                          hasBreak: watchedValue.hasBreak ?? false,
                          breakStart: watchedValue.breakStart ?? '',
                          breakEnd: watchedValue.breakEnd ?? '',
                        } : {
                          enabled: false,
                          start: '',
                          end: '',
                          hasBreak: false,
                          breakStart: '',
                          breakEnd: '',
                        };
                        
                        return (
                          <div key={dia.value} className="border rounded-lg p-4 space-y-3">
                            {/* Cabeçalho do dia */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FormField
                                  control={form.control}
                                  name={`weeklySchedule.${dia.value}.enabled`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                            className="h-4 w-7 data-[state=checked]:bg-primary"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <span className="font-medium text-sm">{dia.label}</span>
                              </div>
                              {daySchedule.enabled && (
                                <div className="text-xs text-muted-foreground">
                                  {daySchedule.start} - {daySchedule.end}
                                  {daySchedule.hasBreak && ` (com intervalo)`}
                                </div>
                              )}
                            </div>
                            
                            {/* Campos de horário - só aparecem se o dia estiver ativo */}
                            {daySchedule.enabled && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                                {/* Horário de trabalho */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Horário</label>
                                  <div className="flex items-center gap-2">
                                    <FormField
                                      control={form.control}
                                      name={`weeklySchedule.${dia.value}.start`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input 
                                              type="time" 
                                              {...field} 
                                              className="h-8 text-sm"
                                              placeholder="--:--"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <span className="text-muted-foreground text-sm">até</span>
                                    <FormField
                                      control={form.control}
                                      name={`weeklySchedule.${dia.value}.end`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input 
                                              type="time" 
                                              {...field} 
                                              className="h-8 text-sm"
                                              placeholder="--:--"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                                
                                {/* Intervalo */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FormField
                                      control={form.control}
                                      name={`weeklySchedule.${dia.value}.hasBreak`}
                                      render={({ field }) => (
                                        <FormItem className="flex items-center gap-2">
                                          <FormControl>
                                            <Switch
                                              checked={field.value}
                                              onCheckedChange={field.onChange}
                                                className="h-4 w-7 data-[state=checked]:bg-primary"
                                            />
                                          </FormControl>
                                          <span className="text-xs font-medium text-muted-foreground">Intervalo</span>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  {/* Campos de intervalo - só aparecem se toggle estiver ativo */}
                                  {daySchedule.hasBreak && (
                                    <div className="flex items-center gap-2">
                                      <FormField
                                        control={form.control}
                                        name={`weeklySchedule.${dia.value}.breakStart`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormControl>
                                              <Input 
                                                type="time" 
                                                {...field} 
                                                className="h-8 text-sm"
                                                placeholder="--:--"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <span className="text-muted-foreground text-sm">até</span>
                                      <FormField
                                        control={form.control}
                                        name={`weeklySchedule.${dia.value}.breakEnd`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormControl>
                                              <Input 
                                                type="time" 
                                                {...field} 
                                                className="h-8 text-sm"
                                                placeholder="--:--"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    </Section>
                  </TabsContent>

                  {/* Aba Lembretes */}
                  <TabsContent value="lembretes" className="flex-1 overflow-y-auto space-y-6 mt-6">
                    <Section 
                      title="Lembretes" 
                      icon={<Bell className="h-4 w-4 text-primary" />}
                    >
                  <FormField
                    control={form.control}
                    name="defaultReminder"
                    render={({ field }) => (
                      <FormItem>
                            <FormLabel>Lembrete</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === 'disabled' ? null : parseInt(value))}
                          defaultValue={field.value === null ? 'disabled' : field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {lembretes.map((lembrete) => (
                              <SelectItem key={lembrete.value} value={lembrete.value}>
                                {lembrete.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('defaultReminder') !== null && (
                    <FormField
                      control={form.control}
                      name="reminderMessage"
                      render={({ field }) => (
                        <FormItem>
                              <FormLabel>Mensagem</FormLabel>
                          <FormControl>
                                <div className="space-y-4">
                                  <div className="relative">
                              <Textarea
                                {...field}
                                      placeholder="Digite sua mensagem..."
                                      className="min-h-[120px] pr-8 resize-none"
                                      maxLength={500}
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-2 h-6 w-6 p-0"
                                  >
                                    <SmilePlus className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="end">
                                  <EmojiPicker
                                    onEmojiClick={(emojiData) => {
                                      field.onChange(field.value + emojiData.emoji);
                                    }}
                                    width="100%"
                                    height={400}
                                  />
                                </PopoverContent>
                              </Popover>
                                  </div>
                                  
                                  {/* Contador de caracteres */}
                                  <TooltipProvider>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        Use: 
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <code className="bg-muted px-1 py-0.5 rounded cursor-help hover:bg-muted-foreground/20 transition-colors">{`{data}`}</code>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Data do evento</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <code className="bg-muted px-1 py-0.5 rounded cursor-help hover:bg-muted-foreground/20 transition-colors">{`{hora}`}</code>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Horário do evento</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <code className="bg-muted px-1 py-0.5 rounded cursor-help hover:bg-muted-foreground/20 transition-colors">{`{nome}`}</code>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Se o contato não tiver nome, nao sera exibido.</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <code className="bg-muted px-1 py-0.5 rounded cursor-help hover:bg-muted-foreground/20 transition-colors">{`{link}`}</code>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Link do Google Meet, se o evento for uma chamada de video.</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {field.value?.length || 0}/500 caracteres
                                      </span>
                                    </div>
                                  </TooltipProvider>
                                  
                                  {/* Templates */}
                                  <div className="grid grid-cols-4 gap-2">
                                    {templatesMensagem.map((template) => (
                                      <Button
                                        key={template.id}
                                        type="button"
                                        variant="outline"
                                        className="h-auto p-2 justify-start text-left hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
                                        onClick={() => field.onChange(template.text)}
                                      >
                                        <div className="flex items-center gap-2 w-full">
                                          <span className="text-sm flex-shrink-0">
                                            {template.icon}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-foreground truncate">
                                              {template.text}
                                            </div>
                                          </div>
                                        </div>
                                      </Button>
                                    ))}
                                  </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                    </Section>
                  </TabsContent>

                  {/* Aba Avançado */}
                  <TabsContent value="avancado" className="flex-1 overflow-y-auto space-y-6 mt-6">
                    <Section 
                      title="Configurações Avançadas" 
                      icon={<Settings className="h-4 w-4 text-primary" />}
                    >
                      <FormField
                        control={form.control}
                        name="aiPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prompt para IA</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Textarea
                                  {...field}
                                  placeholder="Digite um prompt personalizado para a IA gerar eventos..."
                                  className="min-h-[200px] resize-none"
                                  maxLength={1000}
                                />
                                <div className="flex justify-end">
                                  <span className="text-xs text-muted-foreground">
                                    {field.value?.length || 0}/1000 caracteres
                                  </span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Gatilho de Escassez */}
                      <FormField
                        control={form.control}
                        name="enableScarcityMode"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2 mb-3">
                              <FormLabel className="text-base">Exibição de horários</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" align="start" className="max-w-[250px]">
                                    <p className="whitespace-normal">Escolha como os horários serão exibidos aos clientes</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <FormControl>
                              <div className="flex items-center gap-3">
                                <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-fit">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => field.onChange(true)}
                                          className={cn(
                                            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                            field.value 
                                              ? "bg-primary text-primary-foreground shadow" 
                                              : ""
                                          )}
                                        >
                                          Limitar horários
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="start" className="max-w-[250px]">
                                        <p className="whitespace-normal">Limita a quantidade de horários exibidos</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => field.onChange(false)}
                                          className={cn(
                                            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                            !field.value 
                                              ? "bg-primary text-primary-foreground shadow" 
                                              : ""
                                          )}
                                        >
                                          Listar todos horários
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="start" className="max-w-[250px]">
                                        <p className="whitespace-normal">Exibe todos os horários disponíveis<br />sem limite para o cliente escolher</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                {/* Quantidade de horários (só aparece se o gatilho estiver ativo) */}
                                {field.value && (
                                  <FormField
                                    control={form.control}
                                    name="maxSlotsToShow"
                                    render={({ field: slotsField }) => (
                                      <FormItem className="mb-0">
                                        <div className="flex items-center gap-2">
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min={1}
                                              max={50}
                                              {...slotsField}
                                              onChange={(e) => slotsField.onChange(parseInt(e.target.value) || 1)}
                                              value={slotsField.value || 5}
                                              className="w-[100px] h-9"
                                              placeholder="Quantidade"
                                            />
                                          </FormControl>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                              </TooltipTrigger>
                                              <TooltipContent side="top" align="start" className="max-w-[280px]">
                                                <p className="whitespace-normal">
                                                  Número de horários que serão mostrados ao cliente (máximo 50).<br />
                                                  <br />
                                                  Exemplo: se você tiver 20 horários disponíveis e definir 5, apenas 5 serão exibidos para criar sensação de urgência.
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Section>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="border-t pt-4 mt-4 flex-shrink-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Salvar Configurações'
                    )}
                  </Button>
                </DialogFooter>
                </form>
              </div>
            </div>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de criação de agenda */}
      <GoogleCalendarCreateCalendarDialog
        isOpen={isCreateCalendarOpen}
        onClose={() => setIsCreateCalendarOpen(false)}
        onSuccess={() => {
          loadCalendars();
        }}
      />
    </>
  );
} 
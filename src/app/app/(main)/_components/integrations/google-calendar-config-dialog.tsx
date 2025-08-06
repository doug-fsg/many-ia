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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { GoogleCalendarCreateCalendarDialog } from './google-calendar-create-calendar-dialog';
import { Plus, RefreshCw, SmilePlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2 } from 'lucide-react';
import * as z from 'zod';

const googleCalendarConfigSchema = z.object({
  googleCalendarEnabled: z.boolean().default(false),
  calendarId: z.string().optional(),
  defaultEventDuration: z.number().min(30).max(120).optional(),
  workingHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido de hora').optional(),
  workingHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido de hora').optional(),
  allowedDays: z.array(z.string()).min(1, 'Selecione pelo menos um dia').optional(),
  minAdvanceTime: z.number().min(0).max(24).optional(),
  maxAdvanceTime: z.number().min(1).max(90).optional(),
  defaultReminder: z.number().min(0).max(1440).nullable(),
  reminderMessage: z.string().max(500, 'A mensagem deve ter no máximo 500 caracteres').optional(),
  autoCreateEvents: z.boolean().default(false),
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

const lembretes = [
  { value: 'disabled', label: 'Desativado' },
  { value: '10', label: '10 minutos antes' },
  { value: '30', label: '30 minutos antes' },
  { value: '60', label: '1 hora antes' },
  { value: '1440', label: '1 dia antes' },
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
        throw new Error(data.error || 'Erro ao carregar calendários');
      }

      if (data.calendars) {
        setCalendars(data.calendars);
      }
    } catch (error: any) {
      console.error('Erro ao carregar calendários:', error);
      setCalendarError(error.message);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar a lista de calendários.',
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
      workingHoursStart: defaultValues?.workingHoursStart ?? '09:00',
      workingHoursEnd: defaultValues?.workingHoursEnd ?? '18:00',
      allowedDays: defaultValues?.allowedDays ?? ['1', '2', '3', '4', '5'],
      minAdvanceTime: defaultValues?.minAdvanceTime ?? 1,
      maxAdvanceTime: defaultValues?.maxAdvanceTime ?? 30,
      defaultReminder: defaultValues?.defaultReminder ?? null,
      reminderMessage: defaultValues?.reminderMessage ?? '',
      autoCreateEvents: defaultValues?.autoCreateEvents ?? false,
    },
  });

  // Atualiza o formulário apenas quando o diálogo é aberto
  useEffect(() => {
    if (isOpen && defaultValues) {
      form.reset({
        googleCalendarEnabled: defaultValues.googleCalendarEnabled ?? false,
        calendarId: defaultValues.calendarId ?? '',
        defaultEventDuration: defaultValues.defaultEventDuration ?? 60,
        workingHoursStart: defaultValues.workingHoursStart ?? '09:00',
        workingHoursEnd: defaultValues.workingHoursEnd ?? '18:00',
        allowedDays: defaultValues.allowedDays ?? ['1', '2', '3', '4', '5'],
        minAdvanceTime: defaultValues.minAdvanceTime ?? 1,
        maxAdvanceTime: defaultValues.maxAdvanceTime ?? 30,
        defaultReminder: defaultValues.defaultReminder ?? null,
        reminderMessage: defaultValues.reminderMessage ?? '',
        autoCreateEvents: defaultValues.autoCreateEvents ?? false,
      });
    }
  }, [isOpen, defaultValues, form]);

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      console.log('[LOG] onSubmit do modal GoogleCalendarConfigDialog chamado:', data);
      // Apenas formata os dados e passa para o componente pai
      const formattedData = {
        googleCalendarEnabled: Boolean(data.googleCalendarEnabled),
        calendarId: data.calendarId || '',
        defaultEventDuration: parseInt(data.defaultEventDuration) || 60,
        workingHoursStart: data.workingHoursStart || '09:00',
        workingHoursEnd: data.workingHoursEnd || '18:00',
        allowedDays: Array.isArray(data.allowedDays) ? data.allowedDays : ['1', '2', '3', '4', '5'],
        minAdvanceTime: parseInt(data.minAdvanceTime) || 1,
        maxAdvanceTime: parseInt(data.maxAdvanceTime) || 30,
        defaultReminder: data.defaultReminder === 'disabled' ? null : (parseInt(data.defaultReminder) || 30),
        reminderMessage: data.reminderMessage || '',
        autoCreateEvents: Boolean(data.autoCreateEvents),
      };
      console.log('[LOG] Dados formatados enviados para onSuccess do modal:', formattedData);
      // Apenas atualiza o estado temporário no componente pai
      if (onSuccess) {
        onSuccess(formattedData);
      }
      // Apenas fecha o modal sem salvar as alterações no formulário principal
      onClose();
    } catch (error: any) {
      console.error('Erro ao processar dados:', error);
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
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurações do Google Calendar</DialogTitle>
            <DialogDescription>
              Configure como seu agente deve gerenciar eventos no Google Calendar.
              As configurações só serão salvas quando você clicar em "Salvar Alterações" no formulário principal.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="googleCalendarEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativar Agendamento</FormLabel>
                      <FormDescription>
                        Permitir que o agente crie eventos automaticamente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('googleCalendarEnabled') && (
                <>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="calendarId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agenda para Eventos</FormLabel>
                          <div className="flex gap-2">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoadingCalendars}
                            >
                              <FormControl>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder={
                                    isLoadingCalendars 
                                      ? "Carregando agendas..." 
                                      : calendarError 
                                        ? "Erro ao carregar agendas" 
                                        : "Selecione uma agenda"
                                  } />
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
                          {!calendarError && (
                            <FormDescription>
                              Escolha em qual agenda os eventos serão criados
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="defaultEventDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração Padrão dos Eventos</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a duração padrão" />
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
                        <FormDescription>
                          Duração padrão para eventos criados pelo agente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="workingHoursStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Início</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workingHoursEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Término</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="allowedDays"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Dias Permitidos</FormLabel>
                          <FormDescription>
                            Selecione os dias em que o agente pode criar eventos
                          </FormDescription>
                        </div>
                        {diasDaSemana.map((dia) => (
                          <FormField
                            key={dia.value}
                            control={form.control}
                            name="allowedDays"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={dia.value}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(dia.value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, dia.value])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value: string) => value !== dia.value
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {dia.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="minAdvanceTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Antecedência Mínima (horas)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={24}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Mínimo de horas antes para agendar
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxAdvanceTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Antecedência Máxima (dias)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={90}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Máximo de dias para agendar no futuro
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="defaultReminder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lembrete Padrão</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === 'disabled' ? null : parseInt(value))}
                          defaultValue={field.value === null ? 'disabled' : field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione quando enviar o lembrete" />
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
                        <FormDescription>
                          Quando o participante deve receber o lembrete do evento
                        </FormDescription>
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
                          <FormLabel>Mensagem do Lembrete</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Textarea
                                {...field}
                                placeholder="Ex: 👋 Olá! Não esqueça do nosso compromisso em {tempo}. Aguardo você! 🗓️"
                                className="min-h-[100px] pr-8"
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
                          </FormControl>
                          <FormDescription>
                            Use {`{tempo}`} para incluir quanto tempo falta para o evento.
                            Clique no botão de emoji para adicionar emojis à mensagem.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="autoCreateEvents"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Criação Automática</FormLabel>
                          <FormDescription>
                            Criar eventos automaticamente após coletar informações
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  disabled={isLoading}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Aplicar Temporariamente'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
        {/* Mover o modal de criação de agenda para fora do form principal */}
      <GoogleCalendarCreateCalendarDialog
        isOpen={isCreateCalendarOpen}
        onClose={() => setIsCreateCalendarOpen(false)}
        onSuccess={() => {
          // Recarregar lista de calendários
          loadCalendars();
        }}
      />
      </Dialog>
    </>
  );
} 
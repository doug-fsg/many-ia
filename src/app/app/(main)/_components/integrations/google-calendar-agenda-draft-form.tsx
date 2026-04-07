'use client';

import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Section } from '@/components/ui/section';
import { GoogleCalendarWeeklyScheduleFields } from './google-calendar-weekly-schedule-fields';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/lib/google-calendar-agendas';
import {
  Plus,
  RefreshCw,
  Bell,
  Settings,
  Clock,
  SlidersHorizontal,
  HelpCircle,
  Video,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useWatch } from 'react-hook-form';
import { FEATURE_GOOGLE_CALENDAR_LEMBRETES_TAB } from './google-calendar-ui-flags';

const duracoesPadrao = [
  { value: '30', label: '30 minutos' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1 hora e 30 minutos' },
  { value: '120', label: '2 horas' },
];

const tiposEvento: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'video_call', label: 'Chamada de Vídeo', Icon: Video },
  { value: 'presencial', label: 'Reunião Presencial', Icon: Building2 },
];

const lembretes = [
  { value: 'disabled', label: 'Desativado' },
  { value: '10', label: '10 minutos antes' },
  { value: '30', label: '30 minutos antes' },
  { value: '60', label: '1 hora antes' },
  { value: '1440', label: '1 dia antes' },
];

type Calendar = { id: string; name: string; primary?: boolean };

const tabTriggerClass =
  'flex flex-1 flex-col gap-0.5 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none sm:flex-row sm:gap-2 sm:text-sm';

function DraftMaxSlots({ form }: { form: UseFormReturn<AgendaItem> }) {
  const scarcity = useWatch({ control: form.control, name: 'enableScarcityMode' });
  if (!scarcity) return null;
  return (
    <FormField
      control={form.control}
      name="maxSlotsToShow"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Máx. de horários exibidos</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              max={50}
              className="w-28"
              value={field.value ?? 5}
              onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 5)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ResponsibleEmailsField({ form }: { form: UseFormReturn<AgendaItem> }) {
  const [draft, setDraft] = React.useState('');

  const addEmail = (field: { value: string[]; onChange: (v: string[]) => void }) => {
    const email = draft.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (field.value?.includes(email)) {
      setDraft('');
      return;
    }
    field.onChange([...(field.value || []), email]);
    setDraft('');
  };

  return (
    <FormField
      control={form.control}
      name="responsibleEmails"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Responsáveis</FormLabel>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <FormControl>
              <Input
                placeholder="Digite um email..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail(field);
                  }
                }}
              />
            </FormControl>
            <Button type="button" variant="secondary" className="shrink-0 sm:w-auto" onClick={() => addEmail(field)}>
              Adicionar
            </Button>
          </div>
          {field.value && field.value.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {field.value.map((email: string, i: number) => (
                <div
                  key={email}
                  className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm text-primary"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => field.onChange(field.value.filter((_: string, j: number) => j !== i))}
                    className="text-primary/70 hover:text-primary"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type Props = {
  form: UseFormReturn<AgendaItem>;
  calendars: Calendar[];
  isLoadingCalendars: boolean;
  calendarError: string | null;
  loadCalendars: () => void;
  onCreateCalendarClick: () => void;
};

export function GoogleCalendarAgendaDraftForm({
  form,
  calendars,
  isLoadingCalendars,
  calendarError,
  loadCalendars,
  onCreateCalendarClick,
}: Props) {
  return (
    <Form {...form}>
      <Tabs defaultValue="geral" className="w-full">
        <TabsList
          className={cn(
            'grid h-auto w-full gap-1 rounded-xl bg-muted p-1.5',
            FEATURE_GOOGLE_CALENDAR_LEMBRETES_TAB
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-3',
          )}
        >
          <TabsTrigger value="geral" className={tabTriggerClass}>
            <Settings className="size-4 shrink-0" />
            <span>Geral</span>
          </TabsTrigger>
          <TabsTrigger value="horarios" className={tabTriggerClass}>
            <Clock className="size-4 shrink-0" />
            <span>Horários</span>
          </TabsTrigger>
          {FEATURE_GOOGLE_CALENDAR_LEMBRETES_TAB && (
            <TabsTrigger value="lembretes" className={tabTriggerClass}>
              <Bell className="size-4 shrink-0" />
              <span>Lembretes</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="comportamento" className={tabTriggerClass}>
            <SlidersHorizontal className="size-4 shrink-0" />
            <span>Comportamento</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-3 space-y-4 pb-2">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do perfil</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Comercial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="calendarId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendário Google</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={isLoadingCalendars}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecionar…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {calendars.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} {c.primary && '(Principal)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onCreateCalendarClick}
                      disabled={isLoadingCalendars}
                      title="Novo calendário no Google"
                      aria-label="Criar calendário na conta Google"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={loadCalendars}
                      disabled={isLoadingCalendars}
                      title="Atualizar lista"
                      aria-label="Recarregar calendários"
                    >
                      <RefreshCw className={cn('h-4 w-4', isLoadingCalendars && 'animate-spin')} aria-hidden="true" />
                    </Button>
                  </div>
                  {calendarError && <p className="mt-2 text-sm text-destructive">{calendarError}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
                control={form.control}
                name="defaultEventDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v, 10))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Duração" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {duracoesPadrao.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
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
                    <FormLabel>Tipo de evento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposEvento.map((t) => {
                          const ItemIcon = t.Icon;
                          return (
                            <SelectItem key={t.value} value={t.value} textValue={t.label}>
                              <span className="flex items-center gap-2">
                                <ItemIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                {t.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          <ResponsibleEmailsField form={form} />

          <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="minAdvanceTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Antecedência mínima (horas)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v, 10))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                    <FormLabel>Antecedência máxima (dias)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v, 10))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
        </TabsContent>

        <TabsContent value="horarios" className="mt-3 pb-2">
          <GoogleCalendarWeeklyScheduleFields control={form.control} basePath="weeklySchedule" />
        </TabsContent>

        {FEATURE_GOOGLE_CALENDAR_LEMBRETES_TAB && (
          <TabsContent value="lembretes" className="mt-3 space-y-4 pb-2">
            <Section title="Lembretes" icon={<Bell className="h-4 w-4 text-primary" />}>
              <FormField
                control={form.control}
                name="defaultReminder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lembrete</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === 'disabled' ? null : parseInt(v, 10))}
                      value={field.value === null || field.value === undefined ? 'disabled' : String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lembretes.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
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
                name="reminderMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem do lembrete</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} placeholder="Mensagem opcional" maxLength={500} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>
          </TabsContent>
        )}

        <TabsContent value="comportamento" className="mt-3 space-y-4 pb-2">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="aiPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Prompt para IA (esta agenda){' '}
                    <span className="text-destructive" aria-hidden>
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Instruções para a IA ao criar eventos nesta agenda"
                      className="min-h-[120px]"
                      maxLength={1000}
                      required
                      aria-required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enableScarcityMode"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-2 flex items-center gap-2">
                    <FormLabel>Limitar horários exibidos</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[260px]">
                          Mostra apenas alguns slots para criar sensação de urgência.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange(true)}
                        className={cn(
                          'rounded-md px-3 py-1 text-sm',
                          field.value ? 'bg-primary text-primary-foreground' : 'bg-muted',
                        )}
                      >
                        Limitar
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange(false)}
                        className={cn(
                          'rounded-md px-3 py-1 text-sm',
                          !field.value ? 'bg-primary text-primary-foreground' : 'bg-muted',
                        )}
                      >
                        Listar todos
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DraftMaxSlots form={form} />
          </div>
        </TabsContent>
      </Tabs>
    </Form>
  );
}

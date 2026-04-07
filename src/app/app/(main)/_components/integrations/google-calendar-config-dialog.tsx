'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Form } from '@/components/ui/form';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as z from 'zod';
import { GoogleCalendarCreateCalendarDialog } from './google-calendar-create-calendar-dialog';
import { GoogleCalendarAgendaListView } from './google-calendar-agenda-list';
import { GoogleCalendarAgendaDraftForm } from './google-calendar-agenda-draft-form';
import {
  createEmptyAgenda,
  buildAgendaFromLegacy,
  hasLegacyAgendaData,
  validateAgendaItem,
  generateDefaultWeeklyScheduleEmpty,
} from './google-calendar-agenda-helpers';
import type { AgendaItem } from '@/lib/google-calendar-agendas';
import { FEATURE_GOOGLE_CALENDAR_LEMBRETES_TAB } from './google-calendar-ui-flags';

const mainFormSchema = z.object({
  agendas: z.array(z.any()).default([]),
});

type MainFormValues = z.infer<typeof mainFormSchema>;

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

  const [modalView, setModalView] = useState<'list' | 'form'>('list');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<MainFormValues>({
    resolver: zodResolver(mainFormSchema),
    defaultValues: {
      agendas: [],
    },
  });

  const draftForm = useForm<AgendaItem>({
    defaultValues: createEmptyAgenda(),
  });

  const loadCalendars = async () => {
    try {
      setIsLoadingCalendars(true);
      setCalendarError(null);
      const response = await fetch('/api/integrations/google-calendar/calendars');
      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'REAUTH_REQUIRED' || data.requiresReauth) {
          const errorMessage =
            data.message || 'Sessão expirada. Por favor, reconecte sua conta do Google Calendar.';
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMessage = err.message || 'Não foi possível carregar a lista de calendários.';
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

  useEffect(() => {
    if (isOpen) {
      loadCalendars();
    }
  }, [isOpen]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (!isOpen || wasOpen) return;

    const fromDefaults = defaultValues ?? {};
    const rawAgendas = fromDefaults.agendas;
    const hasStoredAgendas = Array.isArray(rawAgendas) && rawAgendas.length > 0;
    let initialAgendas: AgendaItem[] = hasStoredAgendas ? [...rawAgendas] : [];

    if (initialAgendas.length === 0 && hasLegacyAgendaData(fromDefaults)) {
      initialAgendas = [buildAgendaFromLegacy(fromDefaults)];
    }

    form.reset({
      agendas: initialAgendas,
    });

    setModalView('list');
    setEditingIndex(null);
    draftForm.reset(createEmptyAgenda());
  }, [isOpen, defaultValues, form, draftForm]);

  const handleNewAgenda = useCallback(() => {
    setEditingIndex(null);
    draftForm.reset(createEmptyAgenda());
    setModalView('form');
  }, [draftForm]);

  const handleEditAgenda = useCallback(
    (index: number) => {
      const agendas = form.getValues('agendas') || [];
      const item = agendas[index];
      if (!item) return;
      setEditingIndex(index);
      draftForm.reset(JSON.parse(JSON.stringify(item)) as AgendaItem);
      setModalView('form');
    },
    [form, draftForm]
  );

  const handleRemoveAgenda = useCallback(
    (index: number) => {
      const agendas = [...(form.getValues('agendas') || [])];
      agendas.splice(index, 1);
      form.setValue('agendas', agendas);
    },
    [form]
  );

  const handleToggleAgendaEnabled = useCallback(
    (index: number, enabled: boolean) => {
      const agendas = [...(form.getValues('agendas') || [])];
      const item = agendas[index];
      if (!item) return;
      agendas[index] = { ...item, enabled };
      form.setValue('agendas', agendas);
    },
    [form]
  );

  const handleBackFromForm = useCallback(() => {
    setModalView('list');
    setEditingIndex(null);
    draftForm.reset(createEmptyAgenda());
  }, [draftForm]);

  const handleSaveDraftAgenda = useCallback(() => {
    draftForm.handleSubmit((data) => {
      const err = validateAgendaItem(data);
      if (err) {
        toast({ title: 'Atenção', description: err, variant: 'destructive' });
        return;
      }

      const agendas = [...(form.getValues('agendas') || [])];
      const prevAgenda = editingIndex !== null ? agendas[editingIndex] : null;
      const normalized: AgendaItem = {
        ...data,
        // Ativo/inativo só na lista de perfis — não duplicar no formulário.
        enabled: prevAgenda ? prevAgenda.enabled !== false : true,
        id: editingIndex !== null ? agendas[editingIndex]?.id || data.id : data.id || crypto.randomUUID(),
        defaultEventDuration: Number(data.defaultEventDuration) || 60,
        minAdvanceTime: Number(data.minAdvanceTime) ?? 1,
        maxAdvanceTime: Number(data.maxAdvanceTime) ?? 30,
        maxSlotsToShow: data.enableScarcityMode ? Number(data.maxSlotsToShow) || 5 : undefined,
      };

      if (editingIndex !== null) {
        agendas[editingIndex] = normalized;
      } else {
        agendas.push(normalized);
      }

      form.setValue('agendas', agendas);
      toast({ title: 'Agenda salva', description: 'Você pode adicionar mais ou clicar em Salvar e fechar para aplicar ao assistente.' });
      setModalView('list');
      setEditingIndex(null);
      draftForm.reset(createEmptyAgenda());
    })();
  }, [draftForm, form, editingIndex, toast]);

  const buildFormattedPayload = (data: MainFormValues) => {
    const agendas = (data.agendas || []) as AgendaItem[];
    const first =
      agendas.find((a) => a.enabled !== false) ?? agendas[0];

    const normalizedAgendas = agendas.map((ag) => ({
      ...ag,
      defaultEventDuration: Number(ag.defaultEventDuration) || 60,
      minAdvanceTime: Number(ag.minAdvanceTime) ?? 1,
      maxAdvanceTime: Number(ag.maxAdvanceTime) ?? 30,
      maxSlotsToShow: ag.enableScarcityMode ? Number(ag.maxSlotsToShow) || 5 : undefined,
    }));

    return {
      googleCalendarEnabled: true,
      agendas: normalizedAgendas,
      calendarId: String(first?.calendarId || ''),
      defaultEventDuration: Number(first?.defaultEventDuration) || 60,
      weeklySchedule: first?.weeklySchedule || generateDefaultWeeklyScheduleEmpty(),
      minAdvanceTime: Number(first?.minAdvanceTime) || 1,
      maxAdvanceTime: Number(first?.maxAdvanceTime) || 30,
      defaultReminder:
        first?.defaultReminder === 'disabled' || first?.defaultReminder == null
          ? null
          : Number(first.defaultReminder),
      reminderMessage: String(first?.reminderMessage || ''),
      autoCreateEvents: Boolean(defaultValues?.autoCreateEvents ?? true),
      eventType: first?.eventType || 'video_call',
      responsibleEmails: Array.isArray(first?.responsibleEmails) ? first.responsibleEmails : [],
      aiPrompt: String(first?.aiPrompt || ''),
      enableScarcityMode: Boolean(first?.enableScarcityMode),
      maxSlotsToShow: first?.enableScarcityMode ? Number(first?.maxSlotsToShow) || 5 : undefined,
    };
  };

  const onSubmitMain = async (data: MainFormValues) => {
    try {
      setIsLoading(true);

      const agendas = data.agendas || [];
      if (agendas.length === 0) {
        toast({
          title: 'Nenhuma agenda',
          description: 'Crie pelo menos uma agenda antes de salvar.',
          variant: 'destructive',
        });
        return;
      }

      for (let i = 0; i < agendas.length; i++) {
        const ag = agendas[i] as AgendaItem;
        const v = validateAgendaItem(ag);
        if (v) {
          toast({
            title: 'Revise suas agendas',
            description: `${v} (agenda ${i + 1})`,
            variant: 'destructive',
          });
          return;
        }
      }

      const formattedData = buildFormattedPayload(data);
      onSuccess?.(formattedData);
      onClose();
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Erro ao processar as configurações.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const agendasWatch = form.watch('agendas') || [];

  const editingAgendaName =
    editingIndex !== null
      ? (form.getValues('agendas') as AgendaItem[])[editingIndex]?.name || `Agenda ${editingIndex + 1}`
      : null;

  const dialogTitle =
    modalView === 'list'
      ? 'Google Calendar'
      : editingAgendaName
        ? `Editar perfil: ${editingAgendaName}`
        : 'Novo perfil de agendamento';

  const dialogDescription =
    modalView === 'list'
      ? 'Gerencie seus perfis de agendamento. Cada perfil pode ter horários e um calendário Google distintos.'
      : FEATURE_GOOGLE_CALENDAR_LEMBRETES_TAB
        ? 'Configure os horários, lembrete e calendário de destino para este perfil.'
        : 'Configure horários e calendário de destino para este perfil.';

  /** Largura ~1280px (desktop); altura ~760px até o teto 90vh. Em telas estreitas acompanha o viewport. */
  const dialogShellClass =
    '!flex h-[min(760px,90vh)] w-[min(1280px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className={dialogShellClass}>
          <div className="shrink-0 border-b px-12 py-8">
            <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" aria-label="Localização no fluxo">
              <span className={modalView === 'list' ? 'font-medium text-foreground' : ''}>
                Seus perfis
              </span>
              {modalView === 'form' && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="font-medium text-foreground">
                    {editingAgendaName ? `Editar: ${editingAgendaName}` : 'Novo perfil'}
                  </span>
                </>
              )}
            </nav>
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription className="leading-relaxed">{dialogDescription}</DialogDescription>
            </DialogHeader>
          </div>

          {modalView === 'list' && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitMain)}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="min-h-0 flex-1 overflow-y-auto px-12 py-8">
                  <div className="mb-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Perfis de agendamento
                    </p>
                  </div>
                  <GoogleCalendarAgendaListView
                    agendas={agendasWatch as AgendaItem[]}
                    calendars={calendars}
                    onNew={handleNewAgenda}
                    onEdit={handleEditAgenda}
                    onRemove={handleRemoveAgenda}
                    onToggleEnabled={handleToggleAgendaEnabled}
                  />
                </div>

                <DialogFooter className="shrink-0 border-t bg-background px-12 py-6">
                  <p className="mr-auto text-xs text-muted-foreground">
                    Clique em <strong>Salvar e fechar</strong> para aplicar no assistente e gravar ao sair desta página (ex.: <strong>Salvar alterações</strong> na configuração).
                  </p>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar e fechar'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {modalView === 'form' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-12 py-8">
                <GoogleCalendarAgendaDraftForm
                  form={draftForm}
                  calendars={calendars}
                  isLoadingCalendars={isLoadingCalendars}
                  calendarError={calendarError}
                  loadCalendars={loadCalendars}
                  onCreateCalendarClick={() => setIsCreateCalendarOpen(true)}
                />
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t bg-background px-12 py-6 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
                <p className="mr-auto text-xs text-muted-foreground">
                  Isso volta à lista. Finalize com <strong>Salvar e fechar</strong> para persistir.
                </p>
                <Button type="button" variant="outline" onClick={handleBackFromForm}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSaveDraftAgenda} className="min-w-[140px]">
                  Concluir perfil
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

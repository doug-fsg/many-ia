'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AgendaItem } from '@/lib/google-calendar-agendas';
import { Calendar, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import * as React from 'react';
import { cn } from '@/lib/utils';

type CalendarOpt = { id: string; name: string; primary?: boolean };

type Props = {
  agendas: AgendaItem[];
  calendars: CalendarOpt[];
  onNew: () => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onToggleEnabled: (index: number, enabled: boolean) => void;
};

function EmptyAgendaIllustration() {
  return (
    <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-primary/15" />
      <Sparkles className="absolute -right-1 top-2 h-4 w-4 text-primary/40" />
      <Sparkles className="absolute -left-0.5 bottom-4 h-3 w-3 text-primary/30" />
      <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-border/80 bg-card shadow-sm">
        <Calendar className="h-10 w-10 text-muted-foreground/80" strokeWidth={1.25} />
        <div className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

export function GoogleCalendarAgendaListView({
  agendas,
  calendars,
  onNew,
  onEdit,
  onRemove,
  onToggleEnabled,
}: Props) {
  const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null);
  const empty = !agendas || agendas.length === 0;

  if (empty) {
    return (
      <div
        className={cn(
          'mx-auto w-full max-w-sm rounded-2xl border border-border/80 bg-card px-8 py-8 text-center shadow-sm',
        )}
      >
        <EmptyAgendaIllustration />
        <div className="mt-6 space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">Nenhum perfil</h3>
          <p className="text-sm text-muted-foreground">
            Horários e calendário Google por perfil. Adicione quantos precisar.
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            onClick={onNew}
            size="lg"
            className="w-auto max-w-full gap-2 rounded-xl px-10 py-4 text-base font-semibold shadow-sm"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Criar primeiro perfil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        {agendas.map((ag, index) => {
          const calName = calendars.find((c) => c.id === ag.calendarId)?.name ?? 'Calendário não selecionado';
          const isActive = ag.enabled !== false;
          return (
            <div
              key={ag.id}
              className={cn(
                'flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm sm:flex-nowrap',
                isActive ? 'border-border/80' : 'border-muted-foreground/25 bg-muted/25',
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-semibold text-foreground">{ag.name || `Perfil ${index + 1}`}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-normal text-muted-foreground">
                    Google Calendar
                  </Badge>
                  <span className="truncate text-xs text-muted-foreground">{calName}</span>
                  {!isActive && (
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      Inativo
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <span className="hidden text-xs text-muted-foreground sm:inline">Ativo</span>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(v) => onToggleEnabled(index, v)}
                        className="data-[state=checked]:bg-primary"
                        aria-label={
                          isActive
                            ? `Desativar perfil ${ag.name || index + 1}`
                            : `Ativar perfil ${ag.name || index + 1}`
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isActive ? 'Desativar este perfil (pausa slots e uso na API)' : 'Ativar este perfil novamente'}
                  </TooltipContent>
                </Tooltip>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => onEdit(index)}
                  aria-label={`Editar perfil ${ag.name || index + 1}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteIndex(index)}
                  aria-label={`Remover perfil ${ag.name || index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-border/80 pt-6">
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={onNew}
            size="lg"
            className="w-auto max-w-full gap-2 rounded-xl px-10 py-4 text-base font-semibold shadow-sm"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Adicionar perfil
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover esta agenda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A agenda será removida ao confirmar (use &quot;Salvar e
              fechar&quot; no final para persistir no assistente).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteIndex !== null) onRemove(deleteIndex);
                setDeleteIndex(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

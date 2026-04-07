import type { WeeklySchedule } from '@/lib/available-slots';

/**
 * Item de agenda quando múltiplas agendas estão ativas no AIConfig (campo JSON `agendas`).
 */
export type AgendaItem = {
  id: string;
  /** Quando `false`, a agenda não entra em slots/API até ser reativada. Omitido = ativa. */
  enabled?: boolean;
  name: string;
  calendarId: string;
  weeklySchedule: WeeklySchedule;
  defaultEventDuration: number;
  minAdvanceTime?: number;
  maxAdvanceTime?: number;
  defaultReminder?: number | null;
  reminderMessage?: string;
  eventType?: string;
  responsibleEmails?: string[];
  enableScarcityMode?: boolean;
  maxSlotsToShow?: number;
  aiPrompt?: string;
};

/**
 * Campos efetivos para slots/eventos (mesmo formato usado em modo legado).
 */
export type EffectiveAgendaFields = {
  calendarId: string | null;
  weeklySchedule: WeeklySchedule;
  defaultEventDuration: number;
  minAdvanceTime: number;
  maxAdvanceTime: number;
  enableScarcityMode: boolean;
  maxSlotsToShow: number;
};

type AIConfigAgendaSource = {
  agendas?: unknown;
  calendarId?: string | null;
  weeklySchedule?: unknown;
  defaultEventDuration?: number | null;
  minAdvanceTime?: number | null;
  maxAdvanceTime?: number | null;
  enableScarcityMode?: boolean | null;
  maxSlotsToShow?: number | null;
};

function parseAgendas(raw: unknown): AgendaItem[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  return raw as AgendaItem[];
}

/**
 * Resolve qual agenda usar para slots/eventos.
 * - `agendas` com itens: usa o item por `agendaId` ou o primeiro **ativo** (`enabled !== false`) se omitido.
 * - `agendas` vazio/null: deriva dos campos legados do AIConfig.
 */
export function getEffectiveAgenda(
  config: AIConfigAgendaSource,
  agendaId?: string | null
): { agenda: EffectiveAgendaFields; agendaItemId?: string } | null {
  const agendas = parseAgendas(config.agendas);

  if (agendas && agendas.length > 0) {
    let item: AgendaItem | undefined;
    if (agendaId) {
      item = agendas.find((a) => a.id === agendaId);
      if (!item || item.enabled === false) return null;
    } else {
      item = agendas.find((a) => a.enabled !== false);
    }

    if (item && item.calendarId?.trim()) {
      return {
        agendaItemId: item.id,
        agenda: {
          calendarId: item.calendarId,
          weeklySchedule: (item.weeklySchedule || {}) as WeeklySchedule,
          defaultEventDuration: item.defaultEventDuration ?? 60,
          minAdvanceTime: item.minAdvanceTime ?? 0,
          maxAdvanceTime: item.maxAdvanceTime ?? 30,
          enableScarcityMode: item.enableScarcityMode ?? false,
          maxSlotsToShow: item.maxSlotsToShow ?? 5,
        },
      };
    }

    /** Agenda ativa sem calendário — inválido para uso. */
    if (item) return null;
  }

  // Modo legado (calendarId vazio = primary no Google Calendar)
  return {
    agenda: {
      calendarId: config.calendarId ?? null,
      weeklySchedule: (config.weeklySchedule || {}) as WeeklySchedule,
      defaultEventDuration: config.defaultEventDuration ?? 60,
      minAdvanceTime: config.minAdvanceTime ?? 0,
      maxAdvanceTime: config.maxAdvanceTime ?? 30,
      enableScarcityMode: config.enableScarcityMode ?? false,
      maxSlotsToShow: config.maxSlotsToShow ?? 5,
    },
  };
}

/**
 * Valida se existe configuração utilizável para agenda (slots).
 */
export function hasUsableAgendaForSlots(
  config: AIConfigAgendaSource,
  agendaId?: string | null
): boolean {
  const resolved = getEffectiveAgenda(config, agendaId);
  if (!resolved) return false;
  const hasDays = Object.values(resolved.agenda.weeklySchedule).some((d) => d?.enabled);
  return hasDays;
}

/**
 * Quantidade de “perfis” de agenda no AIConfig: itens em `agendas` ou 1 perfil legado
 * (calendarId / weekly habilitado) quando o array ainda não existe.
 */
export function countAgendaProfilesOnConfig(config: AIConfigAgendaSource): number {
  const agendas = parseAgendas(config.agendas);
  if (agendas && agendas.length > 0) {
    return agendas.length;
  }
  const hasCalendar = Boolean(config.calendarId && String(config.calendarId).trim());
  const ws = (config.weeklySchedule || {}) as WeeklySchedule;
  const hasWeekly = Object.values(ws).some((d) => d?.enabled);
  return hasCalendar || hasWeekly ? 1 : 0;
}

/** True se a conta tiver mais de um perfil de agenda no total (vários assistentes ou várias agendas no mesmo). */
export function accountHasMultipleAgendaProfiles(configs: AIConfigAgendaSource[]): boolean {
  const total = configs.reduce((sum, c) => sum + countAgendaProfilesOnConfig(c), 0);
  return total > 1;
}

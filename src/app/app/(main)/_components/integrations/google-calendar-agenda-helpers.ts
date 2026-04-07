import type { AgendaItem } from '@/lib/google-calendar-agendas';
import type { WeeklySchedule } from '@/lib/available-slots';

export function generateDefaultWeeklyScheduleEmpty(): WeeklySchedule {
  const days = ['0', '1', '2', '3', '4', '5', '6'];
  const schedule: WeeklySchedule = {};
  days.forEach((d) => {
    schedule[d] = {
      enabled: false,
      start: '',
      end: '',
      hasBreak: false,
      breakStart: '',
      breakEnd: '',
    };
  });
  return schedule;
}

export function createEmptyAgenda(): AgendaItem {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    name: '',
    calendarId: '',
    weeklySchedule: generateDefaultWeeklyScheduleEmpty(),
    defaultEventDuration: 60,
    minAdvanceTime: 1,
    maxAdvanceTime: 30,
    defaultReminder: null,
    reminderMessage: '',
    eventType: 'video_call',
    responsibleEmails: [],
    enableScarcityMode: false,
    maxSlotsToShow: 5,
    aiPrompt: '',
  };
}

/** Detecta se há config legada (sem array agendas) com dados utilizáveis */
export function hasLegacyAgendaData(v: {
  calendarId?: string | null;
  weeklySchedule?: unknown;
}): boolean {
  if (v.calendarId && String(v.calendarId).trim()) return true;
  const ws = (v.weeklySchedule || {}) as WeeklySchedule;
  return Object.values(ws).some((d) => d?.enabled);
}

export function buildAgendaFromLegacy(v: {
  calendarId?: string | null;
  defaultEventDuration?: number | null;
  weeklySchedule?: unknown;
  minAdvanceTime?: number | null;
  maxAdvanceTime?: number | null;
  defaultReminder?: number | null;
  reminderMessage?: string | null;
  eventType?: string | null;
  responsibleEmails?: string[] | null;
  enableScarcityMode?: boolean | null;
  maxSlotsToShow?: number | null;
  aiPrompt?: string | null;
}): AgendaItem {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    name: 'Agenda principal',
    calendarId: String(v.calendarId || ''),
    weeklySchedule: (v.weeklySchedule as WeeklySchedule) || generateDefaultWeeklyScheduleEmpty(),
    defaultEventDuration: v.defaultEventDuration ?? 60,
    minAdvanceTime: v.minAdvanceTime ?? 1,
    maxAdvanceTime: v.maxAdvanceTime ?? 30,
    defaultReminder: v.defaultReminder ?? null,
    reminderMessage: v.reminderMessage || '',
    eventType: (v.eventType as AgendaItem['eventType']) || 'video_call',
    responsibleEmails: v.responsibleEmails || [],
    enableScarcityMode: v.enableScarcityMode ?? false,
    maxSlotsToShow: v.maxSlotsToShow ?? 5,
    aiPrompt: v.aiPrompt || '',
  };
}

export function validateAgendaItem(ag: AgendaItem): string | null {
  if (!String(ag.name || '').trim()) return 'Informe o nome da agenda.';
  if (ag.enabled === false) return null;
  if (!String(ag.calendarId || '').trim()) return 'Selecione um calendário Google.';
  const ws = ag.weeklySchedule || {};
  if (!Object.values(ws).some((d) => d?.enabled)) return 'Ative pelo menos um dia da semana com horário.';
  if (!String(ag.aiPrompt || '').trim()) return 'Informe o prompt para IA desta agenda.';
  return null;
}

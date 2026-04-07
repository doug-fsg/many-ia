/**
 * Lógica para calcular horários disponíveis considerando:
 * - weeklySchedule (config do usuário)
 * - Eventos já agendados no Google Calendar
 * - minAdvanceTime, maxAdvanceTime
 * - Apenas horários futuros
 * - enableScarcityMode + maxSlotsToShow
 */

export type DaySchedule = {
  enabled: boolean;
  start?: string;
  end?: string;
  hasBreak?: boolean;
  breakStart?: string;
  breakEnd?: string;
};

export type WeeklySchedule = Record<string, DaySchedule>;

export type Slot = {
  start: string; // ISO 8601
  end: string;   // ISO 8601
};

export type CalendarEvent = {
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
const DEFAULT_DURATION = 60;
const DEFAULT_MIN_ADVANCE_HOURS = 0;
const DEFAULT_MAX_ADVANCE_DAYS = 30;

function addMinutesToDate(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/** Cria Date com horário no timezone (usa offset -03:00 para America/Sao_Paulo) */
function createDateInTimezone(
  dateStr: string,
  timeStr: string,
  timezone: string
): Date {
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  const offset = timezone === 'America/Sao_Paulo' ? '-03:00' : '+00:00';
  return new Date(`${dateStr}T${String(h || 0).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00${offset}`);
}

function getDayOfWeek(date: Date, timezone: string): number {
  const str = date.toLocaleDateString('en-CA', { timeZone: timezone });
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

function getDateStrInTimezone(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-CA', { timeZone: timezone });
}

const SLOT_INCREMENT_MINUTES = 30;

/**
 * Gera slots candidatos a partir do weeklySchedule
 */
function generateCandidateSlots(
  weeklySchedule: WeeklySchedule,
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  timezone: string
): Slot[] {
  const slots: Slot[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = getDateStrInTimezone(current, timezone);
    const dayOfWeek = getDayOfWeek(current, timezone);
    const dayConfig = weeklySchedule[String(dayOfWeek)];

    if (!dayConfig?.enabled || !dayConfig.start || !dayConfig.end) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    const dayStart = createDateInTimezone(dateStr, dayConfig.start, timezone);
    const dayEnd = createDateInTimezone(dateStr, dayConfig.end, timezone);

    if (dayConfig.hasBreak && dayConfig.breakStart && dayConfig.breakEnd) {
      const breakStart = createDateInTimezone(dateStr, dayConfig.breakStart, timezone);
      const breakEnd = createDateInTimezone(dateStr, dayConfig.breakEnd, timezone);

      let slotStart = new Date(dayStart);
      while (addMinutesToDate(slotStart, durationMinutes) <= breakStart) {
        slots.push({
          start: slotStart.toISOString(),
          end: addMinutesToDate(slotStart, durationMinutes).toISOString(),
        });
        slotStart = addMinutesToDate(slotStart, SLOT_INCREMENT_MINUTES);
      }

      slotStart = new Date(breakEnd);
      while (addMinutesToDate(slotStart, durationMinutes) <= dayEnd) {
        slots.push({
          start: slotStart.toISOString(),
          end: addMinutesToDate(slotStart, durationMinutes).toISOString(),
        });
        slotStart = addMinutesToDate(slotStart, SLOT_INCREMENT_MINUTES);
      }
    } else {
      let slotStart = new Date(dayStart);
      while (addMinutesToDate(slotStart, durationMinutes) <= dayEnd) {
        slots.push({
          start: slotStart.toISOString(),
          end: addMinutesToDate(slotStart, durationMinutes).toISOString(),
        });
        slotStart = addMinutesToDate(slotStart, SLOT_INCREMENT_MINUTES);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return slots;
}

function slotsOverlap(slot: Slot, event: CalendarEvent): boolean {
  const eventStart = event.start?.dateTime || event.start?.date;
  const eventEnd = event.end?.dateTime || event.end?.date;
  if (!eventStart || !eventEnd) return false;

  const slotStart = new Date(slot.start).getTime();
  const slotEnd = new Date(slot.end).getTime();
  const evStart = new Date(eventStart).getTime();
  const evEnd = new Date(eventEnd).getTime();

  return slotStart < evEnd && slotEnd > evStart;
}

/**
 * Calcula horários disponíveis
 */
export async function calculateAvailableSlots(
  params: {
    weeklySchedule: WeeklySchedule;
    calendarEvents: CalendarEvent[];
    durationMinutes?: number;
    minAdvanceTimeHours?: number;
    maxAdvanceTimeDays?: number;
    /** Quando informado, substitui o cálculo baseado em minAdvanceTime */
    timeMin?: Date;
    /** Quando informado, substitui o cálculo baseado em maxAdvanceTime */
    timeMax?: Date;
    enableScarcityMode?: boolean;
    maxSlotsToShow?: number;
    timezone?: string;
  }
): Promise<Slot[]> {
  const {
    weeklySchedule,
    calendarEvents,
    durationMinutes = DEFAULT_DURATION,
    minAdvanceTimeHours = DEFAULT_MIN_ADVANCE_HOURS,
    maxAdvanceTimeDays = DEFAULT_MAX_ADVANCE_DAYS,
    timeMin: paramTimeMin,
    timeMax: paramTimeMax,
    enableScarcityMode = false,
    maxSlotsToShow = 5,
    timezone = DEFAULT_TIMEZONE,
  } = params;

  const now = new Date();
  const minStart =
    paramTimeMin ?? addMinutesToDate(now, minAdvanceTimeHours * 60);
  const maxEnd =
    paramTimeMax ?? addMinutesToDate(now, maxAdvanceTimeDays * 24 * 60);

  let slots = generateCandidateSlots(
    weeklySchedule,
    minStart,
    maxEnd,
    durationMinutes,
    timezone
  );

  // Filtrar slots no passado
  slots = slots.filter((s) => new Date(s.start) >= now);

  // Filtrar slots que sobrepõem eventos
  slots = slots.filter(
    (slot) => !calendarEvents.some((ev) => slotsOverlap(slot, ev))
  );

  // Ordenar por data/hora (mais próximos primeiro)
  slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Aplicar modo escassez
  if (enableScarcityMode && maxSlotsToShow > 0) {
    slots = slots.slice(0, maxSlotsToShow);
  }

  return slots;
}

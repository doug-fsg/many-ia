// app/api/integrations/google-calendar/available-slots/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCalendarEvents } from '@/lib/google-calendar';
import { calculateAvailableSlots, type WeeklySchedule } from '@/lib/available-slots';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  if (token === process.env.MASTER_KEY) {
    const { searchParams } = new URL(request.url);
    return searchParams.get('userId');
  }

  try {
    const decoded = verifyToken(token);
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET /api/integrations/google-calendar/available-slots
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { hasGoogleCalendarAccess } = await import('@/lib/feature-flags');
  const hasAccess = await hasGoogleCalendarAccess(userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Acesso ao Google Calendar não disponível para este usuário' },
      { status: 403 }
    );
  }

  const integration = await prisma.googleCalendarIntegration.findUnique({
    where: { userId },
  });
  if (!integration) {
    return NextResponse.json(
      { error: 'Integração com Google Calendar não encontrada' },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const configId = searchParams.get('configId');
  const timezone = searchParams.get('timezone') || 'America/Sao_Paulo';
  const timeMinParam = searchParams.get('timeMin');
  const timeMaxParam = searchParams.get('timeMax');

  const whereClause: { userId: string; googleCalendarEnabled: boolean; id?: string } = {
    userId,
    googleCalendarEnabled: true,
  };
  if (configId) whereClause.id = configId;

  const aiConfig = await prisma.aIConfig.findFirst({
    where: whereClause,
    select: {
      weeklySchedule: true,
      defaultEventDuration: true,
      minAdvanceTime: true,
      maxAdvanceTime: true,
      enableScarcityMode: true,
      maxSlotsToShow: true,
      calendarId: true,
    },
  });

  if (!aiConfig) {
    return NextResponse.json(
      { error: 'Nenhuma configuração com Google Calendar ativo encontrada' },
      { status: 404 }
    );
  }

  const weeklySchedule = (aiConfig.weeklySchedule || {}) as WeeklySchedule;
  const hasEnabledDays = Object.values(weeklySchedule).some((d) => d?.enabled);
  if (!hasEnabledDays) {
    return NextResponse.json({ slots: [] });
  }

  const now = new Date();
  const minAdvanceHours = aiConfig.minAdvanceTime ?? 0;
  const maxAdvanceDays = aiConfig.maxAdvanceTime ?? 30;

  const timeMin = timeMinParam
    ? new Date(timeMinParam)
    : new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
  const timeMax = timeMaxParam
    ? new Date(timeMaxParam)
    : new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000);

  if (isNaN(timeMin.getTime()) || isNaN(timeMax.getTime())) {
    return NextResponse.json(
      { error: 'timeMin e timeMax devem ser datas válidas (ISO 8601)' },
      { status: 400 }
    );
  }
  if (timeMin >= timeMax) {
    return NextResponse.json(
      { error: 'timeMin deve ser anterior a timeMax' },
      { status: 400 }
    );
  }

  let calendarEvents: Array<{ start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }> = [];
  try {
    calendarEvents = await getCalendarEvents(userId, {
      calendarId: aiConfig.calendarId || undefined,
      timeMin,
      timeMax,
    });
  } catch (err: unknown) {
    const isReauth = (err as { code?: string })?.code === 'REAUTH_REQUIRED';
    if (isReauth) {
      return NextResponse.json(
        {
          error: 'REAUTH_REQUIRED',
          message: 'Sessão expirada. Por favor, reconecte sua conta do Google Calendar.',
          requiresReauth: true,
        },
        { status: 401 }
      );
    }
    console.error('Erro ao buscar eventos:', err);
    return NextResponse.json(
      { error: 'Falha ao buscar eventos do calendário' },
      { status: 500 }
    );
  }

  const slots = await calculateAvailableSlots({
    weeklySchedule,
    calendarEvents,
    durationMinutes: aiConfig.defaultEventDuration ?? 60,
    minAdvanceTimeHours: minAdvanceHours,
    maxAdvanceTimeDays: maxAdvanceDays,
    timeMin,
    timeMax,
    enableScarcityMode: aiConfig.enableScarcityMode ?? false,
    maxSlotsToShow: aiConfig.maxSlotsToShow ?? 5,
    timezone,
  });

  return NextResponse.json({ slots });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { accountHasMultipleAgendaProfiles } from '@/lib/google-calendar-agendas';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const masterKey = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!masterKey) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Verificar se a MASTER_KEY fornecida corresponde à do .env
  if (masterKey !== process.env.MASTER_KEY) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Obter parâmetros de query
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');

    // Buscar integração do Google Calendar
    const googleCalendarIntegration = await prisma.googleCalendarIntegration.findUnique({
      where: { userId: params.userId },
      select: {
        id: true,
        email: true,
        calendarId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Construir filtro para configurações
    const whereClause: any = { userId: params.userId };
    if (configId) {
      whereClause.id = configId;
    }

    // Buscar configurações de IA com campos do Google Calendar
    const aiConfigs = await prisma.aIConfig.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        isActive: true,
        nomeAtendenteDigital: true,
        // Campos do Google Calendar
        googleCalendarEnabled: true,
        calendarId: true,
        defaultEventDuration: true,
        weeklySchedule: true,
        minAdvanceTime: true,
        maxAdvanceTime: true,
        defaultReminder: true,
        reminderMessage: true,
        autoCreateEvents: true,
        eventType: true,
        responsibleEmails: true,
        aiPrompt: true,
        enableScarcityMode: true,
        maxSlotsToShow: true,
        agendas: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const multipleAgendaProfilesConfigured = accountHasMultipleAgendaProfiles(aiConfigs);

    return NextResponse.json({
      integration: googleCalendarIntegration,
      configurations: aiConfigs,
      /** `true` quando há mais de um perfil de agenda no total (vários assistentes com agenda ou 2+ no mesmo). */
      multipleAgendaProfilesConfigured,
    });
  } catch (error) {
    console.error('Error retrieving Google Calendar info:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

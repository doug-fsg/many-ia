import { NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema específico para configurações do Google Calendar
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
  autoCreateEvents: z.boolean().default(false)
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar configuração atual do usuário
    const aiConfig = await prisma.aIConfig.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        googleCalendarEnabled: true,
        calendarId: true,
        defaultEventDuration: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        allowedDays: true,
        minAdvanceTime: true,
        maxAdvanceTime: true,
        defaultReminder: true,
        reminderMessage: true,
        autoCreateEvents: true,
      },
    });

    return NextResponse.json({ config: aiConfig });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log('Dados recebidos:', data);

    try {
      // Validar dados recebidos
      const validatedData = googleCalendarConfigSchema.parse(data);
      console.log('Dados validados:', validatedData);

      // Buscar configuração existente
      const existingConfig = await prisma.aIConfig.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (existingConfig) {
        // Se existe configuração, atualiza
        const aiConfig = await prisma.aIConfig.update({
          where: {
            id: existingConfig.id,
          },
          data: {
            googleCalendarEnabled: validatedData.googleCalendarEnabled,
            calendarId: validatedData.calendarId,
            defaultEventDuration: validatedData.defaultEventDuration,
            workingHoursStart: validatedData.workingHoursStart,
            workingHoursEnd: validatedData.workingHoursEnd,
            allowedDays: validatedData.allowedDays,
            minAdvanceTime: validatedData.minAdvanceTime,
            maxAdvanceTime: validatedData.maxAdvanceTime,
            defaultReminder: validatedData.defaultReminder,
            reminderMessage: validatedData.reminderMessage,
            autoCreateEvents: validatedData.autoCreateEvents,
          },
        });
        return NextResponse.json({ config: aiConfig });
      } else {
        // Se não existe, cria uma nova
        const aiConfig = await prisma.aIConfig.create({
          data: {
            userId: session.user.id,
            // Campos do Google Calendar
            googleCalendarEnabled: validatedData.googleCalendarEnabled,
            calendarId: validatedData.calendarId,
            defaultEventDuration: validatedData.defaultEventDuration,
            workingHoursStart: validatedData.workingHoursStart,
            workingHoursEnd: validatedData.workingHoursEnd,
            allowedDays: validatedData.allowedDays,
            minAdvanceTime: validatedData.minAdvanceTime,
            maxAdvanceTime: validatedData.maxAdvanceTime,
            defaultReminder: validatedData.defaultReminder,
            reminderMessage: validatedData.reminderMessage,
            autoCreateEvents: validatedData.autoCreateEvents,
            // Campos padrão necessários
            isActive: true,
            nomeAtendenteDigital: '',
            quemEhAtendente: '',
            oQueAtendenteFaz: '',
            objetivoAtendente: '',
            comoAtendenteDeve: '',
            horarioAtendimento: 'Atender 24h por dia',
            informacoesEmpresa: '',
            embedding: {}, // Campo obrigatório
          },
        });
        return NextResponse.json({ config: aiConfig });
      }
    } catch (validationError) {
      console.error('Erro de validação:', validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json(
      { error: 'Falha ao salvar configurações: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 
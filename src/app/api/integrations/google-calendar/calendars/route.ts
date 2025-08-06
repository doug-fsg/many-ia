import { NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';
import { oauth2Client } from '@/lib/google-calendar';

// Listar calendários
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    console.log('Buscando integração para usuário:', session.user.id);
    // Buscar tokens do usuário
    const integration = await prisma.googleCalendarIntegration.findUnique({
      where: { userId: session.user.id },
    });

    if (!integration) {
      console.log('Integração não encontrada para usuário:', session.user.id);
      return NextResponse.json(
        { error: 'Integração não encontrada' },
        { status: 404 }
      );
    }

    console.log('Configurando cliente OAuth2 com tokens');
    // Configurar cliente com os tokens
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.expiresAt.getTime(),
    });

    console.log('Buscando lista de calendários');
    // Buscar lista de calendários
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();

    console.log('Calendários encontrados:', response.data.items?.length || 0);
    
    // Formatar os dados dos calendários para o formato esperado pelo frontend
    const formattedCalendars = response.data.items?.map(calendar => ({
      id: calendar.id,
      name: calendar.summary,
      primary: calendar.primary,
      description: calendar.description
    })) || [];

    return NextResponse.json({ calendars: formattedCalendars });
  } catch (error: any) {
    console.error('Erro detalhado ao listar calendários:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    // Se for erro de token expirado ou inválido
    if (error.message?.includes('invalid_grant') || error.message?.includes('Invalid Credentials')) {
      return NextResponse.json(
        { error: 'Sessão expirada. Por favor, reconecte sua conta do Google Calendar.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Falha ao listar calendários: ' + error.message },
      { status: 500 }
    );
  }
}

// Criar novo calendário
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar tokens do usuário
    const integration = await prisma.googleCalendarIntegration.findUnique({
      where: { userId: session.user.id },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integração não encontrada' },
        { status: 404 }
      );
    }

    // Configurar cliente com os tokens
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.expiresAt.getTime(),
    });

    const data = await request.json();

    // Criar novo calendário
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendars.insert({
      requestBody: {
        summary: data.name,
        description: data.description,
        timeZone: 'America/Sao_Paulo', // Usar timezone do Brasil
      },
    });

    return NextResponse.json({ calendar: response.data });
  } catch (error) {
    console.error('Erro ao criar calendário:', error);
    return NextResponse.json(
      { error: 'Falha ao criar calendário' },
      { status: 500 }
    );
  }
} 
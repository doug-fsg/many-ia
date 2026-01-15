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
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar Feature Flag
    const { hasGoogleCalendarAccess } = await import('@/lib/feature-flags');
    const hasAccess = await hasGoogleCalendarAccess(session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso ao Google Calendar não disponível para este usuário' },
        { status: 403 }
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

    // Tentar renovar token se necessário antes de usar
    try {
      // Verificar se precisa renovar o token
      if (integration.expiresAt && new Date() > integration.expiresAt) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Atualizar tokens no banco
        await prisma.googleCalendarIntegration.update({
          where: { id: integration.id },
          data: {
            accessToken: credentials.access_token || integration.accessToken,
            refreshToken: credentials.refresh_token || integration.refreshToken,
            expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : integration.expiresAt,
          },
        });
        
        // Atualizar credenciais do cliente
        oauth2Client.setCredentials(credentials);
      }
    } catch (refreshError: any) {
      // Se erro ao renovar, verificar se é invalid_grant
      if (refreshError?.response?.data?.error === 'invalid_grant' || 
          refreshError?.message?.includes('invalid_grant') ||
          refreshError?.response?.data?.error_description?.includes('Token has been expired or revoked')) {
        return NextResponse.json(
          { 
            error: 'REAUTH_REQUIRED',
            message: 'Sessão expirada. Por favor, reconecte sua conta do Google Calendar.',
            requiresReauth: true 
          },
          { status: 401 }
        );
      }
      // Se for outro erro, continuar e tentar usar mesmo assim
    }
    
    // Buscar lista de calendários
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();
    
    // Formatar os dados dos calendários para o formato esperado pelo frontend
    const formattedCalendars = response.data.items?.map(calendar => ({
      id: calendar.id,
      name: calendar.summary,
      primary: calendar.primary,
      description: calendar.description
    })) || [];

    return NextResponse.json({ calendars: formattedCalendars });
  } catch (error: any) {
    // Se for erro de token expirado ou inválido
    if (error?.code === 'REAUTH_REQUIRED' ||
        error?.response?.data?.error === 'invalid_grant' || 
        error?.message?.includes('invalid_grant') || 
        error?.message?.includes('Invalid Credentials') ||
        error?.response?.data?.error_description?.includes('Token has been expired or revoked')) {
      return NextResponse.json(
        { 
          error: 'REAUTH_REQUIRED',
          message: 'Sessão expirada. Por favor, reconecte sua conta do Google Calendar.',
          requiresReauth: true 
        },
        { status: 401 }
      );
    }

    console.error('Erro ao listar calendários:', error);
    return NextResponse.json(
      { error: 'Falha ao listar calendários: ' + (error.message || 'Erro desconhecido') },
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

    // Verificar Feature Flag
    const { hasGoogleCalendarAccess } = await import('@/lib/feature-flags');
    const hasAccess = await hasGoogleCalendarAccess(session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso ao Google Calendar não disponível para este usuário' },
        { status: 403 }
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
  } catch (error: any) {
    // Se for erro de token expirado ou inválido
    if (error?.code === 'REAUTH_REQUIRED' ||
        error?.response?.data?.error === 'invalid_grant' || 
        error?.message?.includes('invalid_grant') || 
        error?.message?.includes('Invalid Credentials') ||
        error?.response?.data?.error_description?.includes('Token has been expired or revoked')) {
      return NextResponse.json(
        { 
          error: 'REAUTH_REQUIRED',
          message: 'Sessão expirada. Por favor, reconecte sua conta do Google Calendar.',
          requiresReauth: true 
        },
        { status: 401 }
      );
    }
    
    console.error('Erro ao criar calendário:', error);
    return NextResponse.json(
      { error: 'Falha ao criar calendário: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 
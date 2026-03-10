// app/api/integrations/google-calendar/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';
import { oauth2Client } from '@/lib/google-calendar';

// Utilitário para autenticar via Bearer token
async function getUserIdFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    return decoded.userId;
  } catch (err) {
    return null;
  }
}

// GET /api/integrations/google-calendar/events
export async function GET(request: NextRequest) {
  // 1) Lê query params
  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get('calendarId') || 'primary';
  const timeMin    = searchParams.get('timeMin');
  const timeMax    = searchParams.get('timeMax');
  const userIdParam = searchParams.get('userId');

  // 2) Extrai userId: se userId na query, usa ele; senão, usa do token
  let userId = userIdParam;
  if (!userId) {
    userId = await getUserIdFromRequest(request);
  }
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar Feature Flag
  const { hasGoogleCalendarAccess } = await import('@/lib/feature-flags');
  const hasAccess = await hasGoogleCalendarAccess(userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Acesso ao Google Calendar não disponível para este usuário' },
      { status: 403 }
    );
  }

  // 3) Busca integração no banco
  let integration;
  try {
    integration = await prisma.googleCalendarIntegration.findUnique({
      where: { userId },
    });
  } catch (dbErr) {
    console.error('Erro no prisma.findUnique:', dbErr);
    return NextResponse.json({ error: 'Erro no banco' }, { status: 500 });
  }

  if (!integration) {
    return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 });
  }

  // 4) Configura OAuth2 e tenta renovar token se necessário
  oauth2Client.setCredentials({
    access_token:  integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date:   integration.expiresAt.getTime(),
  });

  // Tentar renovar token se necessário
  try {
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
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin:       timeMin || undefined,
      timeMax:       timeMax || undefined,
      singleEvents:  true,
      orderBy:       'startTime',
    });
    return NextResponse.json({ events: response.data.items || [] });
  } catch (apiErr: any) {
    console.error('Erro na Google Calendar API:', apiErr);
    
    // Verificar se é erro de token
    if (apiErr?.response?.data?.error === 'invalid_grant' || 
        apiErr?.message?.includes('invalid_grant') ||
        apiErr?.response?.data?.error_description?.includes('Token has been expired or revoked')) {
      return NextResponse.json(
        { 
          error: 'REAUTH_REQUIRED',
          message: 'Sessão expirada. Por favor, reconecte sua conta do Google Calendar.',
          requiresReauth: true 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ error: apiErr.message || 'Erro ao buscar eventos' }, { status: 500 });
  }
}

// POST /api/integrations/google-calendar/events
export async function POST(request: NextRequest) {
  // autenticação idêntica ao GET
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1) Tenta pegar userId do body, depois da query, depois do token
  let userId: string | null = null;
  let calendarId = 'primary';
  let eventData: any = {};
  try {
    const body = await request.json();
    if (body.userId) userId = body.userId;
    if (body.calendarId) calendarId = body.calendarId;
    eventData = { ...body };
    delete eventData.userId;
    delete eventData.calendarId;
  } catch {
    // Se não for JSON válido, ignora
  }
  if (!userId) {
    // tenta pegar da query string
    const { searchParams } = new URL(request.url);
    userId = searchParams.get('userId');
    if (searchParams.get('calendarId')) calendarId = searchParams.get('calendarId')!;
  }
  if (!userId) {
    // pega do token
    try {
      userId = verifyToken(token).userId;
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar Feature Flag
  const { hasGoogleCalendarAccess } = await import('@/lib/feature-flags');
  const hasAccess = await hasGoogleCalendarAccess(userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Acesso ao Google Calendar não disponível para este usuário' },
      { status: 403 }
    );
  }

  // busca integração
  const integration = await prisma.googleCalendarIntegration.findUnique({
    where: { userId },
  });
  if (!integration) {
    return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 });
  }

  // seta credenciais e tenta renovar token se necessário
  oauth2Client.setCredentials({
    access_token:  integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date:   integration.expiresAt.getTime(),
  });

  // Tentar renovar token se necessário
  try {
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
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    const sendUpdates = eventData.sendUpdates || undefined;
    delete eventData.sendUpdates;
    const conferenceData = eventData.conferenceData || undefined;
    delete eventData.conferenceData;
    // Se conferenceData estiver presente, sempre passar conferenceDataVersion: 1
    const conferenceDataVersion = conferenceData ? 1 : undefined;
    
    // Se há conferenceData, adiciona de volta ao eventData
    if (conferenceData) {
      eventData.conferenceData = conferenceData;
    }
    
    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventData,
      sendUpdates,
      conferenceDataVersion,
    });
    return NextResponse.json({ event: response.data });
  } catch (error: any) {
    console.error('Erro ao criar evento:', error);
    
    // Verificar se é erro de token
    if (error?.response?.data?.error === 'invalid_grant' || 
        error?.message?.includes('invalid_grant') ||
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
    
    return NextResponse.json({ error: error.message || 'Erro ao criar evento' }, { status: 500 });
  }
}

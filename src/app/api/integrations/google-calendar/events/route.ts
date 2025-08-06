// app/api/integrations/google-calendar/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';
import { oauth2Client } from '@/lib/google-calendar';

// Utilitário para autenticar via Bearer token, com logs para debug
async function getUserIdFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  console.log('➡️ Authorization header:', authHeader);
  const token = authHeader?.replace('Bearer ', '');
  console.log('➡️ Raw token:', token);
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    console.log('➡️ Decoded token payload:', decoded);
    return decoded.userId;
  } catch (err) {
    console.error('❌ verifyToken error:', err);
    return null;
  }
}

// GET /api/integrations/google-calendar/events
export async function GET(request: NextRequest) {
  console.log('\n=== Novo GET /events ===');

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
  console.log('➡️ userId final usado:', userId);
  if (!userId) {
    console.warn('⚠️ Sem userId → 401 Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('➡️ Query params:', { calendarId, timeMin, timeMax, userId });

  // 3) Busca integração no banco
  let integration;
  try {
    integration = await prisma.googleCalendarIntegration.findUnique({
      where: { userId },
    });
    console.log('➡️ prisma.findUnique(integration):', integration);
  } catch (dbErr) {
    console.error('❌ Erro no prisma.findUnique:', dbErr);
    return NextResponse.json({ error: 'Erro no banco' }, { status: 500 });
  }

  if (!integration) {
    console.warn(`⚠️ Integração não encontrada para userId=${userId}`);
    return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 });
  }

  // 4) Configura OAuth2 e chama Google Calendar API
  oauth2Client.setCredentials({
    access_token:  integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date:   integration.expiresAt.getTime(),
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin:       timeMin || undefined,
      timeMax:       timeMax || undefined,
      singleEvents:  true,
      orderBy:       'startTime',
    });
    console.log('➡️ Google Calendar API response.items.length:', response.data.items?.length);
    return NextResponse.json({ events: response.data.items || [] });
  } catch (apiErr: any) {
    console.error('❌ Erro na Google Calendar API:', apiErr);
    return NextResponse.json({ error: apiErr.message }, { status: 500 });
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

  // busca integração
  const integration = await prisma.googleCalendarIntegration.findUnique({
    where: { userId },
  });
  if (!integration) {
    return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 });
  }

  // seta credenciais e insere evento
  oauth2Client.setCredentials({
    access_token:  integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date:   integration.expiresAt.getTime(),
  });
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
    
    console.log('🔍 Debug conferenceData:', JSON.stringify(conferenceData, null, 2));
    console.log('🔍 Debug conferenceDataVersion:', conferenceDataVersion);
    console.log('🔍 Debug eventData final:', JSON.stringify(eventData, null, 2));
    
    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventData,
      sendUpdates,
      conferenceDataVersion,
    });
    return NextResponse.json({ event: response.data });
  } catch (error: any) {
    console.error('❌ Erro ao criar evento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

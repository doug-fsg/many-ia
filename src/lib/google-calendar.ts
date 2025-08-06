import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

// Configuração do OAuth2
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`
);

// Escopos necessários para o Google Calendar
export const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Função para obter um cliente autenticado do Google Calendar
export async function getGoogleCalendarClient(userId: string) {
  // Buscar a integração do usuário
  const integration = await prisma.googleCalendarIntegration.findUnique({
    where: { userId },
  });

  if (!integration) {
    throw new Error('Integração com Google Calendar não encontrada');
  }

  // Configurar o cliente OAuth2
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // Configurar as credenciais
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken || undefined,
  });

  // Verificar se o token expirou e renovar se necessário
  if (integration.expiresAt && new Date() > integration.expiresAt) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Atualizar tokens no banco de dados
      await prisma.googleCalendarIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: credentials.access_token || integration.accessToken,
          refreshToken: credentials.refresh_token || integration.refreshToken,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : integration.expiresAt,
        },
      });
      
      // Atualizar as credenciais do cliente
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      throw new Error('Falha ao renovar token de acesso');
    }
  }

  // Retornar o cliente do Google Calendar
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Função para criar um evento no Google Calendar
export async function createCalendarEvent({
  userId,
  calendarId,
  summary,
  description,
  startDateTime,
  endDateTime,
  attendees = [],
  reminders = { useDefault: true },
}: {
  userId: string;
  calendarId?: string;
  summary: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}) {
  try {
    // Obter o cliente do Google Calendar
    const calendar = await getGoogleCalendarClient(userId);

    // Buscar o ID do calendário se não foi fornecido
    if (!calendarId) {
      const integration = await prisma.googleCalendarIntegration.findUnique({
        where: { userId },
        select: { calendarId: true },
      });
      calendarId = integration?.calendarId || 'primary';
    }

    // Criar o evento
    const event = {
      summary,
      description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees,
      reminders,
    };

    // Inserir o evento no calendário
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    throw new Error('Falha ao criar evento no calendário');
  }
} 
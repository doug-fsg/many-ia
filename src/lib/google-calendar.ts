import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';

// OAuth2 sem import estático de `googleapis` (pacote muito pesado para compilação dev/HMR).
export const oauth2Client = new OAuth2Client(
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
  const { google } = await import('googleapis');

  // Buscar a integração do usuário
  const integration = await prisma.googleCalendarIntegration.findUnique({
    where: { userId },
  });

  if (!integration) {
    throw new Error('Integração com Google Calendar não encontrada');
  }

  // Configurar o cliente OAuth2
  const userOAuth2 = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // Configurar as credenciais
  userOAuth2.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken || undefined,
  });

  // Verificar se o token expirou e renovar se necessário
  if (integration.expiresAt && new Date() > integration.expiresAt) {
    try {
      const { credentials } = await userOAuth2.refreshAccessToken();
      
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
      userOAuth2.setCredentials(credentials);
    } catch (error: any) {
      // Se o refresh token foi revogado ou expirou, lançar erro específico
      if (error?.response?.data?.error === 'invalid_grant' || 
          error?.message?.includes('invalid_grant') ||
          error?.response?.data?.error_description?.includes('Token has been expired or revoked')) {
        const tokenError: any = new Error('REAUTH_REQUIRED');
        tokenError.code = 'REAUTH_REQUIRED';
        tokenError.message = 'Sessão expirada. Por favor, reconecte sua conta do Google Calendar.';
        throw tokenError;
      }
      
      console.error('Erro ao renovar token:', error);
      throw new Error('Falha ao renovar token de acesso');
    }
  }

  // Retornar o cliente do Google Calendar
  return google.calendar({ version: 'v3', auth: userOAuth2 });
}

// Função para listar eventos do Google Calendar
export async function getCalendarEvents(
  userId: string,
  options: {
    calendarId?: string;
    timeMin?: Date;
    timeMax?: Date;
  }
) {
  const calendar = await getGoogleCalendarClient(userId);
  const integration = await prisma.googleCalendarIntegration.findUnique({
    where: { userId },
    select: { calendarId: true },
  });
  const calendarId = options.calendarId || integration?.calendarId || 'primary';

  const response = await calendar.events.list({
    calendarId,
    timeMin: options.timeMin?.toISOString(),
    timeMax: options.timeMax?.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
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
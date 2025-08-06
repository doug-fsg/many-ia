import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { auth } from '@/services/auth'; // Importação corrigida
import { oauth2Client } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    // Obter o código de autorização da URL
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Código de autorização ausente' },
        { status: 400 }
      );
    }

    // Obter a sessão do usuário atual
    const session = await auth(); // Método de autenticação corrigido
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Trocar o código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Verificar se os tokens foram recebidos
    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'Falha ao obter tokens de acesso' },
        { status: 500 }
      );
    }

    // Configurar o cliente com os tokens
    oauth2Client.setCredentials(tokens);

    // Obter informações do usuário Google
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });
    const userInfo = await oauth2.userinfo.get();

    // Salvar ou atualizar a integração no banco de dados
    const integration = await prisma.googleCalendarIntegration.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        email: userInfo.data.email || undefined,
      },
      create: {
        userId: session.user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(),
        email: userInfo.data.email,
      },
    });

    // Obter lista de calendários do usuário
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();

    // Salvar o ID do calendário principal (se existir)
    if (calendarList.data.items && calendarList.data.items.length > 0) {
      const primaryCalendar = calendarList.data.items.find(
        (cal) => cal.primary === true
      );

      if (primaryCalendar && primaryCalendar.id) {
        await prisma.googleCalendarIntegration.update({
          where: { id: integration.id },
          data: { calendarId: primaryCalendar.id },
        });
      }
    }

    const redirectUrl = new URL('/app/settings/integrations', process.env.NEXT_PUBLIC_APP_URL);
    redirectUrl.searchParams.set('success', 'google-calendar');

    // Redirecionar para a página de configurações com mensagem de sucesso
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Erro no callback do Google Calendar:', error);

    const redirectUrl = new URL('/app/settings/integrations', process.env.NEXT_PUBLIC_APP_URL);
    redirectUrl.searchParams.set('error', 'google-calendar');

    return NextResponse.redirect(redirectUrl);
  }
} 
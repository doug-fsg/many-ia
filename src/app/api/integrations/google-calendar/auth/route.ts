import { NextResponse } from 'next/server';
import { oauth2Client, SCOPES } from '@/lib/google-calendar';
import { auth } from '@/services/auth';
import { hasGoogleCalendarAccess } from '@/lib/feature-flags';

export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar Feature Flag
    const hasAccess = await hasGoogleCalendarAccess(session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso ao Google Calendar não disponível para este usuário' },
        { status: 403 }
      );
    }

    // Gerar URL de autenticação (redirect_uri deve bater com Google Cloud Console)
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`;
    console.log('[GoogleCalendar] Auth iniciado, redirect_uri:', redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Força a exibição da tela de consentimento para obter refresh_token
    });

    // Redirecionar para a URL de autenticação do Google
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Erro ao iniciar autenticação Google:', error);
    return NextResponse.json(
      { error: 'Falha ao iniciar autenticação com Google' },
      { status: 500 }
    );
  }
} 
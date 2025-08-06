import { NextResponse } from 'next/server';
import { oauth2Client, SCOPES } from '@/lib/google-calendar';

export async function GET(request: Request) {
  try {
    // Gerar URL de autenticação
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
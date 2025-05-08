import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';

// Rota de diagnóstico para verificar a autenticação
export async function GET(req: NextRequest) {
  try {
    // Verificar se existe uma sessão via AuthJS
    const session = await auth();
    
    // Tentar decodificar o token JWT manualmente
    const sessionToken = cookies().get('next-auth.session-token')?.value;
    let decodedToken = null;
    
    if (sessionToken) {
      try {
        decodedToken = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET || "",
          salt: process.env.NEXTAUTH_SECRET || "nextauth-salt"
        });
      } catch (error) {
        console.error('[AUTH_CHECK] Erro ao decodificar token:', error);
      }
    }
    
    // Retornar status da autenticação
    return NextResponse.json({
      authenticated: !!session,
      sessionExists: !!session,
      sessionTokenExists: !!sessionToken,
      tokenDecodable: !!decodedToken,
      userInfo: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        isIntegrationUser: session.user.isIntegrationUser
      } : null,
      tokenInfo: decodedToken ? {
        sub: decodedToken.sub,
        email: decodedToken.email,
        isIntegrationUser: decodedToken.isIntegrationUser,
        exp: decodedToken.exp
      } : null
    });
  } catch (error) {
    console.error('[AUTH_CHECK] Erro ao verificar autenticação:', error);
    return NextResponse.json({ 
      error: 'Erro ao verificar autenticação',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
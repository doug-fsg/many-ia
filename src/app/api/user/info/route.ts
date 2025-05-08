import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/services/database';

// Configuração para marcar a rota como dinâmica
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verificar cookie personalizado primeiro
    const authJsToken = cookies().get('authjs.session-token')?.value;
    const nextAuthSessionToken = cookies().get('next-auth.session-token')?.value;
    let userId = null;
    let user = null;
    
    console.log('[USER-INFO] Verificando tokens:', { 
      hasAuthJsToken: !!authJsToken,
      hasNextAuthToken: !!nextAuthSessionToken
    });
    
    if (authJsToken) {
      // Buscar sessão pelo token personalizado
      const session = await prisma.session.findFirst({
        where: {
          sessionToken: authJsToken,
          expires: { gt: new Date() }
        },
        include: { user: true }
      });
      
      if (session?.user) {
        user = session.user;
        userId = user.id;
        console.log('[USER-INFO] Usuário encontrado via authjs.session-token:', {
          userId: user.id,
          email: user.email,
          isIntegrationUser: user.isIntegrationUser
        });
      }
    }
    
    // Se não encontrou usuário via cookie personalizado, tenta via NextAuth
    if (!userId && nextAuthSessionToken) {
      // Tentar encontrar a sessão via token do NextAuth
      const nextAuthSession = await prisma.session.findFirst({
        where: {
          sessionToken: nextAuthSessionToken,
          expires: { gt: new Date() }
        },
        include: { user: true }
      });
      
      if (nextAuthSession?.user) {
        user = nextAuthSession.user;
        userId = user.id;
        console.log('[USER-INFO] Usuário encontrado via next-auth.session-token:', {
          userId: user.id,
          email: user.email,
          isIntegrationUser: user.isIntegrationUser
        });
      }
    }
    
    // Se ainda não encontrou, tenta via método auth() do NextAuth
    if (!userId) {
      const session = await auth();
      if (session?.user?.id) {
        userId = session.user.id;
        console.log('[USER-INFO] Usuário encontrado via NextAuth session:', {
          userId: session.user.id,
          email: session.user.email,
          isIntegrationUser: session.user.isIntegrationUser
        });
      }
    }
    
    // Verificar se o usuário está autenticado
    if (!userId) {
      console.log('[USER-INFO] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // SEMPRE buscar informações diretamente do banco de dados
    // para garantir que os dados mais atualizados sejam retornados
    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!dbUser) {
      console.log('[USER-INFO] Usuário não encontrado no banco de dados:', userId);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    console.log('[USER-INFO] Dados do usuário obtidos do banco de dados:', {
      id: dbUser.id,
      email: dbUser.email,
      isIntegrationUser: dbUser.isIntegrationUser
    });
    
    // Retornar informações do usuário diretamente do banco de dados
    return NextResponse.json({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      isIntegrationUser: dbUser.isIntegrationUser ?? false
    });
  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar informações do usuário' },
      { status: 500 }
    );
  }
} 
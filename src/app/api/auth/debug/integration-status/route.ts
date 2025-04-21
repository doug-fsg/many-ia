import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/services/database';

// ATENÇÃO: Esta é uma rota apenas para fins de depuração e não deve ser usada em produção
export async function GET(req: NextRequest) {
  // Verificar se estamos em produção
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Esta rota não está disponível em produção' },
      { status: 403 }
    );
  }

  try {
    // Verificar cookie personalizado primeiro
    const authJsToken = cookies().get('authjs.session-token')?.value;
    const nextAuthSessionToken = cookies().get('next-auth.session-token')?.value;
    let userId = null;
    
    // Verificar sessão via cookies
    if (authJsToken) {
      const session = await prisma.session.findFirst({
        where: {
          sessionToken: authJsToken,
          expires: { gt: new Date() }
        },
        include: { user: true }
      });
      
      if (session?.user) {
        userId = session.user.id;
      }
    }
    
    if (!userId && nextAuthSessionToken) {
      const session = await prisma.session.findFirst({
        where: {
          sessionToken: nextAuthSessionToken,
          expires: { gt: new Date() }
        },
        include: { user: true }
      });
      
      if (session?.user) {
        userId = session.user.id;
      }
    }
    
    // Se ainda não encontrou, tenta via NextAuth
    if (!userId) {
      const session = await auth();
      if (session?.user?.id) {
        userId = session.user.id;
      }
    }
    
    // Se não encontrou usuário, retornar erro
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Obter informações do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se foi solicitada uma alteração no status
    const { searchParams } = new URL(req.url);
    const setIntegration = searchParams.get('set');
    
    if (setIntegration === 'true' || setIntegration === 'false') {
      const newValue = setIntegration === 'true';
      
      // Atualizar o status de integração
      await prisma.user.update({
        where: { id: userId },
        data: { isIntegrationUser: newValue }
      });
      
      return NextResponse.json({
        success: true,
        message: `Status de integração alterado para ${newValue ? 'true' : 'false'}`,
        userId,
        email: user.email,
        isIntegrationUser: newValue
      });
    }
    
    // Retornar status atual
    return NextResponse.json({
      userId,
      email: user.email,
      name: user.name,
      isIntegrationUser: user.isIntegrationUser
    });
  } catch (error) {
    console.error('Erro ao verificar status de integração:', error);
    return NextResponse.json(
      { error: 'Erro interno ao verificar status de integração' },
      { status: 500 }
    );
  }
} 
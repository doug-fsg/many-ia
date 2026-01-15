import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/services/database';

// Configuração para marcar a rota como dinâmica
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.log('[USER-INFO] Sessão não encontrada ou ID do usuário ausente');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar usuário com informações de afiliado
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        affiliate: true
      }
    });

    if (!user) {
      console.log('[USER-INFO] Usuário não encontrado no banco de dados');
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const isAffiliate = !!user.affiliate;
    const hasActiveSubscription = user.stripeSubscriptionStatus === 'active';

    // Retornar os dados diretamente no objeto de resposta
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isAffiliate,
      hasSubscription: hasActiveSubscription,
      isIntegrationUser: user.isIntegrationUser,
      canCreateTemplates: user.canCreateTemplates,
      stripePriceId: user.stripePriceId
    });
  } catch (error) {
    console.error('[USER-INFO] Erro ao buscar informações do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
import { prisma } from '@/services/database';

/**
 * Verifica se o status da assinatura indica que ela está bloqueada
 * @param status Status da assinatura do Stripe
 * @returns Verdadeiro se o status estiver em um estado bloqueado
 */
export function isSubscriptionBlocked(status: string | null): boolean {
  if (!status) return true;
  
  const blockedStatuses = [
    'incomplete',
    'incomplete_expired',
    'past_due',
    'canceled',
    'unpaid'
  ];
  
  return blockedStatuses.includes(status);
}

/**
 * Desativa todas as configurações de IA do usuário
 * @param userId ID do usuário
 * @returns Um objeto indicando o resultado da operação
 */
export async function deactivateUserAIConfigs(userId: string) {
  try {
    // Buscar todas as configurações de AI do usuário
    const aiConfigs = await prisma.aIConfig.findMany({
      where: {
        userId: userId,
        isActive: true
      }
    });

    if (aiConfigs.length === 0) {
      return {
        success: true,
        message: 'Nenhuma configuração de AI ativa encontrada',
        deactivatedCount: 0
      };
    }

    // Desativar todas as configurações encontradas
    const result = await prisma.aIConfig.updateMany({
      where: {
        userId: userId,
        isActive: true
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      message: `${result.count} configurações de AI desativadas`,
      deactivatedCount: result.count
    };
  } catch (error) {
    console.error('Erro ao desativar configurações de AI:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      deactivatedCount: 0
    };
  }
}

/**
 * Verifica o status da assinatura do usuário
 * @param userId ID do usuário
 * @returns Um objeto com informações sobre o bloqueio da assinatura
 */
export async function checkUserSubscription(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeSubscriptionId: true,
        stripeSubscriptionStatus: true
      }
    });

    if (!user) {
      return {
        isBlocked: true,
        hasSubscription: false,
        subscriptionStatus: null,
        error: 'Usuário não encontrado'
      };
    }

    const hasSubscription = !!user.stripeSubscriptionId;
    const isBlocked = isSubscriptionBlocked(user.stripeSubscriptionStatus);

    return {
      isBlocked,
      hasSubscription,
      subscriptionStatus: user.stripeSubscriptionStatus,
      error: null
    };
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return {
      isBlocked: true,
      hasSubscription: false,
      subscriptionStatus: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
} 
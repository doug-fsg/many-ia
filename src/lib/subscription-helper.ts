import { prisma } from '@/services/database';

/**
 * Verifica se uma assinatura está em um estado bloqueado
 * @param status Status da assinatura do Stripe
 * @returns Verdadeiro se o status estiver em um estado bloqueado
 */
export const isSubscriptionBlocked = (status: string | null | undefined): boolean => {
  if (!status) return false;
  
  const blockedStatuses = [
    'incomplete_expired',
    'incomplete',
    'canceled',
    'unpaid'
  ];
  
  return blockedStatuses.includes(status);
};

/**
 * Verifica o status da assinatura do usuário
 * @param userId ID do usuário
 * @returns Um objeto com informações sobre o bloqueio da assinatura
 */
export const checkUserSubscription = async (userId: string) => {
  try {
    if (!userId) {
      return {
        isBlocked: false,
        subscriptionStatus: null,
        error: 'ID de usuário não fornecido'
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        stripeSubscriptionStatus: true,
        stripeSubscriptionId: true,
        isIntegrationUser: true
      }
    });

    if (!user) {
      return {
        isBlocked: false,
        subscriptionStatus: null,
        error: 'Usuário não encontrado'
      };
    }

    // Usuários com isIntegrationUser=true têm acesso gratuito
    const hasValidAccess = !!user.stripeSubscriptionId || !!user.isIntegrationUser;

    return {
      isBlocked: !user.isIntegrationUser && isSubscriptionBlocked(user.stripeSubscriptionStatus),
      subscriptionStatus: user.stripeSubscriptionStatus,
      hasSubscription: hasValidAccess,
      error: null
    };
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return {
      isBlocked: false,
      subscriptionStatus: null,
      error: 'Erro ao verificar assinatura'
    };
  }
};

/**
 * Desativa todas as configurações de IA do usuário
 * @param userId ID do usuário
 * @returns Um objeto indicando o resultado da operação
 */
export const deactivateUserAIConfigs = async (userId: string) => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'ID de usuário não fornecido'
      };
    }
    
    const result = await prisma.aIConfig.updateMany({
      where: { 
        userId,
        isActive: true // apenas as que estão ativas
      },
      data: { 
        isActive: false 
      }
    });
    
    return {
      success: true,
      count: result.count,
      error: null
    };
  } catch (error) {
    console.error('Erro ao desativar configurações de IA:', error);
    return {
      success: false,
      count: 0,
      error: 'Erro ao desativar configurações de IA'
    };
  }
}; 
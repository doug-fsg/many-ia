import { prisma } from '@/services/database';
import { getUserCurrentPlan } from '@/services/stripe';

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
        stripeSubscriptionStatus: true,
        isIntegrationUser: true
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

    // Usuários com isIntegrationUser=true têm acesso gratuito
    const hasSubscription = !!user.stripeSubscriptionId || !!user.isIntegrationUser;
    const isBlocked = !user.isIntegrationUser && isSubscriptionBlocked(user.stripeSubscriptionStatus);

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

/**
 * Verifica se o usuário excedeu o limite de créditos e desativa configurações se necessário
 * @param userId ID do usuário
 * @returns Um objeto indicando o resultado da operação
 */
export async function checkAndEnforceCreditLimit(userId: string) {
  try {
    console.log(`[CREDIT-LIMIT] Verificando limite de créditos para usuário: ${userId}`);
    
    // Obter plano e créditos atuais
    const plan = await getUserCurrentPlan(userId);
    const creditsUsed = plan.quota.credits?.current || 0;
    const totalCredits = plan.quota.credits?.available || 10000;
    const isOutOfCredits = creditsUsed >= totalCredits;
    
    // Log adicional para monitoramento de limites personalizados
    if (totalCredits !== 10000) {
      console.log(`[CREDIT-LIMIT] LIMITE PERSONALIZADO detectado para usuário ${userId}: ${totalCredits} créditos`);
    }

    console.log(`[CREDIT-LIMIT] Status: ${creditsUsed}/${totalCredits} créditos usados. Excedido: ${isOutOfCredits}`);

    if (isOutOfCredits) {
      // Desativar todas as configurações de IA do usuário
      const result = await deactivateUserAIConfigs(userId);
      console.log(`[CREDIT-LIMIT] Configurações desativadas: ${result.deactivatedCount}`);
      
      return {
        success: true,
        isOutOfCredits: true,
        creditsUsed,
        totalCredits,
        deactivatedCount: result.deactivatedCount,
        message: `Limite de ${totalCredits} créditos excedido. ${result.deactivatedCount} configurações desativadas.`
      };
    }

    return {
      success: true,
      isOutOfCredits: false,
      creditsUsed,
      totalCredits,
      deactivatedCount: 0,
      message: 'Dentro do limite de créditos'
    };
  } catch (error) {
    console.error('[CREDIT-LIMIT] Erro ao verificar limite de créditos:', error);
    return {
      success: false,
      isOutOfCredits: false,
      creditsUsed: 0,
      totalCredits: 0,
      deactivatedCount: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
} 
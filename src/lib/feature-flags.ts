import { prisma } from '@/lib/prisma';
import { isValidFeatureName, type FeatureName } from '@/config/features';

/**
 * Tipo para Feature Flags do usuário
 */
export type UserFeatureFlags = Record<string, boolean>;

/**
 * Retorna todos os Feature Flags de um usuário
 */
export async function getAllFeatureFlags(userId: string): Promise<UserFeatureFlags> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { featureFlags: true },
    });

    if (!user || !user.featureFlags) {
      return {};
    }

    // Garantir que featureFlags é um objeto
    const flags = user.featureFlags as UserFeatureFlags;
    return flags || {};
  } catch (error) {
    console.error('[FEATURE-FLAGS] Erro ao buscar Feature Flags:', error);
    return {};
  }
}

/**
 * Retorna o valor de um Feature Flag específico
 */
export async function getFeatureFlag(
  userId: string,
  featureName: string
): Promise<boolean | null> {
  try {
    const flags = await getAllFeatureFlags(userId);
    return flags[featureName] ?? null;
  } catch (error) {
    console.error(`[FEATURE-FLAGS] Erro ao buscar flag ${featureName}:`, error);
    return null;
  }
}

/**
 * Verifica se um usuário tem acesso a uma feature específica
 * Retorna false se o flag não existir ou estiver desativado
 */
export async function hasFeatureAccess(
  userId: string,
  featureName: string
): Promise<boolean> {
  try {
    // Validar nome da feature se necessário
    if (isValidFeatureName(featureName)) {
      const flag = await getFeatureFlag(userId, featureName);
      return flag === true;
    }

    // Se não for uma feature válida, permitir acesso (compatibilidade)
    // ou retornar false dependendo do comportamento desejado
    const flag = await getFeatureFlag(userId, featureName);
    return flag === true;
  } catch (error) {
    console.error(`[FEATURE-FLAGS] Erro ao verificar acesso a ${featureName}:`, error);
    return false;
  }
}

/**
 * Define o valor de um Feature Flag para um usuário
 */
export async function setFeatureFlag(
  userId: string,
  featureName: string,
  enabled: boolean
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { featureFlags: true },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const currentFlags = (user.featureFlags as UserFeatureFlags) || {};
    const updatedFlags = {
      ...currentFlags,
      [featureName]: enabled,
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        featureFlags: updatedFlags,
      },
    });

    console.log(
      `[FEATURE-FLAGS] Flag ${featureName} ${enabled ? 'ativado' : 'desativado'} para usuário ${userId}`
    );
  } catch (error) {
    console.error(`[FEATURE-FLAGS] Erro ao definir flag ${featureName}:`, error);
    throw error;
  }
}

/**
 * Wrapper específico para Google Calendar
 */
export async function hasGoogleCalendarAccess(userId: string): Promise<boolean> {
  return hasFeatureAccess(userId, 'googleCalendar');
}


'use server'

import { auth } from '@/services/auth'
import { prisma } from '@/services/database'
import { z } from 'zod'
import { deleteAIConfigSchema, upsertAIConfigSchema } from './schema'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from '@/lib/auth-helper'
import { checkUserSubscription } from '@/lib/subscription-helper'

export async function upsertAIConfig(input: z.infer<typeof upsertAIConfigSchema>) {
  console.log('Ação `upsertAIConfig` recebida no servidor - ' + new Date().toISOString());
  console.log('Dados recebidos:', JSON.stringify(input, null, 2));

  try {
    const user = await getAuthenticatedUser();
    
    if (!user?.id) {
      console.error('Erro de autorização: Usuário não encontrado.');
      return {
        error: 'Não autorizado',
        data: null,
      };
    }

    // Fazendo uma cópia segura dos dados de entrada para evitar referências não desejadas
    const inputCopy = JSON.parse(JSON.stringify(input));
    
    // Extraindo os dados de forma segura com valores padrão
    const attachments = inputCopy.attachments || [];
    const temasEvitar = inputCopy.temasEvitar || [];
    const configId = inputCopy.id;
    
    // Removendo propriedades que serão tratadas separadamente
    delete inputCopy.attachments;
    delete inputCopy.temasEvitar;
    delete inputCopy.id;
    
    const restInput = inputCopy;

    // Criar o embedding como um objeto vazio por enquanto
    const embedding = {}

    if (configId) {
      const existingConfig = await prisma.aIConfig.findUnique({
        where: { id: configId },
      })

      if (
        existingConfig &&
        Object.keys(input).length === 2 &&
        'isActive' in input
      ) {
        const result = await prisma.aIConfig.update({
          where: { id: configId },
          data: { isActive: input.isActive },
        })
        return { data: result, error: null }
      }
    }

    if (input.id) {
      const updatedAIConfig = await prisma.aIConfig.update({
        where: {
          id: input.id,
          userId: user.id,
        },
        data: {
          ...restInput,
          embedding,
          temasEvitar: {
            deleteMany: {},
            create: temasEvitar.map((tema) => ({
              tema: typeof tema === 'string' ? tema : tema.tema,
            })),
          },
          attachments: {
            deleteMany: {},
            create: attachments.map((attachment) => ({
              type: attachment.type,
              content: attachment.content,
              description: attachment.description,
            })),
          },
        },
        include: {
          attachments: true,
          temasEvitar: true,
        },
      })

      return {
        error: null,
        data: updatedAIConfig,
      }
    }

    const newAIConfig = await prisma.aIConfig.create({
      data: {
        ...restInput,
        embedding,
        userId: user.id,
        temasEvitar: {
          create: temasEvitar.map((tema) => ({
            tema: typeof tema === 'string' ? tema : tema.tema,
          })),
        },
        attachments: {
          create: attachments.map((attachment) => ({
            type: attachment.type,
            content: attachment.content.split('/').pop() || attachment.content,
            description: attachment.description,
          })),
        },
      },
      include: {
        attachments: true,
        temasEvitar: true,
      },
    })

    revalidatePath('/app/configuracoes')
    return { error: null, data: newAIConfig }
  } catch (error) {
    console.error('Erro CRÍTICO na ação `upsertAIConfig`:', error);
    if (error instanceof z.ZodError) {
      console.error('Erros de validação Zod:', error.errors);
      return {
        error: 'Erro de validação nos dados enviados.',
        data: null,
      };
    }
    return {
      error: error instanceof Error ? error.message : 'Erro desconhecido no servidor',
      data: null,
    }
  }
}

export async function deleteAIConfig(input: z.infer<typeof deleteAIConfigSchema>) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    return {
      error: 'Não autorizado',
      data: null,
    };
  }

  const aiConfig = await prisma.aIConfig.findUnique({
    where: {
      id: input.id,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!aiConfig) {
    return {
      error: 'Não encontrado',
      data: null,
    }
  }

  await prisma.aIConfig.delete({
    where: {
      id: input.id,
      userId: user.id,
    },
  })

  return {
    error: null,
    data: 'Configuração de IA excluída com sucesso',
  }
}

export async function fetchFullAIConfig(id: string) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    return {
      error: 'Não autorizado',
      data: null,
    };
  }

  try {
    const aiConfig = await prisma.aIConfig.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        attachments: true,
        temasEvitar: true,
      },
    })

    if (!aiConfig) {
      return {
        error: 'Configuração não encontrada',
        data: null,
      }
    }

    return {
      error: null,
      data: aiConfig,
    }
  } catch (error) {
    console.error('Erro ao buscar configuração:', error)
    return {
      error: 'Erro ao buscar configuração',
      data: null,
    }
  }
}

export async function toggleAIConfigStatus(configId: string, isActive: boolean) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user?.id) {
      return {
        error: 'Não autorizado',
        data: null,
      };
    }

    if (isActive) {
      const subscription = await checkUserSubscription(user.id);
      
      if (subscription.isBlocked) {
        return {
          error: 'Assinatura bloqueada',
          data: null,
          subscriptionStatus: subscription.subscriptionStatus,
          paymentRequired: true
        };
      }
    }

    const result = await prisma.aIConfig.update({
      where: { id: configId },
      data: { isActive },
    })

    revalidatePath('/app/configuracoes')
    return { data: result, error: null }
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null,
    }
  }
}

export async function getManytalksAccountId() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user?.id) {
      return {
        error: 'Usuário não autenticado',
        data: null,
      };
    }

    const userFromDb = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    return {
      error: null,
      data: userFromDb?.manytalksAccountId,
    }
  } catch (error) {
    console.error('Erro ao buscar manytalksAccountId:', error)
    return {
      error: 'Erro ao buscar ID da conta',
      data: null,
    }
  }
}

export async function updateAIConfigInbox(
  id: string,
  inboxId: number | null,
  inboxName: string | null,
) {
  try {
    await prisma.aIConfig.update({
      where: { id },
      data: {
        inboxId,
        inboxName,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar inbox:', error)
    return { error: 'Falha ao atualizar o canal' }
  }
}

export async function getUserAIConfigs() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user?.id) {
      return {
        error: 'Usuário não autenticado',
        data: null,
      };
    }

    const aiConfigs = await prisma.aIConfig.findMany({
      where: {
        userId: user.id,
      },
      include: {
        attachments: true,
        temasEvitar: true,
      },
      orderBy: {
        createdAt: 'asc',  // Alterado de updatedAt: 'desc' para createdAt: 'asc'
      },
    });

    return {
      error: null,
      data: aiConfigs,
    };
  } catch (error) {
    console.error('Erro ao buscar configurações de IA:', error);
    return {
      error: 'Erro ao buscar configurações de IA',
      data: null,
    };
  }
}

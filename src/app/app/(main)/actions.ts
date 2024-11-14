'use server'

import { auth } from '@/services/auth'
import { prisma } from '@/services/database'
import { z } from 'zod'
import { deleteAIConfigSchema, upsertAIConfigSchema } from './schema'

export async function getUserAIConfigs() {
  const session = await auth()

  const aiConfigs = await prisma.AIConfig.findMany({
    where: {
      userId: session?.user?.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return aiConfigs
}

export async function upsertAIConfig(input: z.infer<typeof upsertAIConfigSchema>) {
  console.log('upsertAIConfig chamado com input:', input);
  const session = await auth()

  if (!session?.user?.id) {
    console.log('Usuário não autenticado');
    return {
      error: 'Não autorizado',
      data: null,
    }
  }

  const { linksPagamento, ...restInput } = input;

  const data = {
    ...restInput,
    condicoesAtendimento: restInput.condicoesAtendimento || '',
  };

  try {
    if (input.id) {
      console.log('Atualizando AIConfig existente com ID:', input.id);
      const updatedAIConfig = await prisma.AIConfig.update({
        where: {
          id: input.id,
          userId: session?.user?.id,
        },
        data: {
          ...data,
          linksPagamento: {
            deleteMany: {},
            create: linksPagamento,
          },
        },
        include: {
          linksPagamento: true,
        },
      })

      console.log('AIConfig atualizado com sucesso:', updatedAIConfig);
      return {
        error: null,
        data: updatedAIConfig,
      }
    } else {
      // Lógica de criação
      const newAIConfig = await prisma.AIConfig.create({
        data: {
          ...data,
          userId: session.user.id,
          linksPagamento: {
            create: linksPagamento,
          },
        },
        include: {
          linksPagamento: true,
        },
      })

      console.log('Novo AIConfig criado:', newAIConfig);
      return {
        error: null,
        data: newAIConfig,
      }
    }
  } catch (error) {
    console.error('Erro ao upsert AIConfig:', error);
    return {
      error: 'Erro ao salvar configuração: ' + (error as Error).message,
      data: null,
    }
  }
}

export async function deleteAIConfig(input: z.infer<typeof deleteAIConfigSchema>) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Não autorizado',
      data: null,
    }
  }

  const aiConfig = await prisma.AIConfig.findUnique({
    where: {
      id: input.id,
      userId: session?.user?.id,
    },
    select: {
      id: true,
    },
  })

  if (!aiConfig) {
    return {
      error: 'Não encontrado',
      data: null,
    }
  }

  await prisma.AIConfig.delete({
    where: {
      id: input.id,
      userId: session?.user?.id,
    },
  })

  return {
    error: null,
    data: 'Configuração de IA excluída com sucesso',
  }
}

export async function fetchFullAIConfig(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Não autorizado',
      data: null,
    }
  }

  try {
    const aiConfig = await prisma.AIConfig.findUnique({
      where: { 
        id,
        userId: session.user.id
      },
      include: { linksPagamento: true }
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
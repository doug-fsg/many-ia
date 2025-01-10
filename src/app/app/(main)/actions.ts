'use server'

import { auth } from '@/services/auth'
import { prisma } from '@/services/database'
import { z } from 'zod'
import { deleteAIConfigSchema, upsertAIConfigSchema } from './schema'
import { createEmbeddingFromAIConfig } from '@/utils/vectorUtils'
import { revalidatePath } from 'next/cache'

async function getUserAIConfigs() {
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

async function upsertAIConfig(input: z.infer<typeof upsertAIConfigSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        error: 'Não autorizado',
        data: null,
      }
    }

    const { attachments, temasEvitar, id: configId, ...restInput } = input

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

    try {
      console.log('Gerando embedding para:', {
        quemEhAtendente: restInput.quemEhAtendente,
        oQueAtendenteFaz: restInput.oQueAtendenteFaz,
        objetivoAtendente: restInput.objetivoAtendente,
        comoAtendenteDeve: restInput.comoAtendenteDeve,
      })

      const { embedding } = await createEmbeddingFromAIConfig({
        quemEhAtendente: restInput.quemEhAtendente,
        oQueAtendenteFaz: restInput.oQueAtendenteFaz,
        objetivoAtendente: restInput.objetivoAtendente,
        comoAtendenteDeve: restInput.comoAtendenteDeve,
      })

      if (input.id) {
        const updatedAIConfig = await prisma.AIConfig.update({
          where: {
            id: input.id,
            userId: session.user.id,
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
      } else {
        const newAIConfig = await prisma.AIConfig.create({
          data: {
            ...restInput,
            embedding,
            userId: session.user.id,
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

        return {
          error: null,
          data: newAIConfig,
        }
      }
    } catch (embeddingError) {
      console.error('Erro ao gerar embedding:', embeddingError)
      throw embeddingError
    }

    console.log('=== Server Action Concluída com Sucesso ===')
    revalidatePath('/app/configuracoes')
    return { data: result, error: null }
  } catch (error) {
    console.error('Erro:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null,
    }
  }
}

async function deleteAIConfig(input: z.infer<typeof deleteAIConfigSchema>) {
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

async function fetchFullAIConfig(id: string) {
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
        userId: session.user.id,
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

async function toggleAIConfigStatus(configId: string, isActive: boolean) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        error: 'Não autorizado',
        data: null,
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

async function getManytalksAccountId() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        error: 'Usuário não autenticado',
        data: null,
      }
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    })

    return {
      error: null,
      data: user?.manytalksAccountId,
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

export {
  getUserAIConfigs,
  upsertAIConfig,
  deleteAIConfig,
  toggleAIConfigStatus,
  getManytalksAccountId,
  fetchFullAIConfig,
}

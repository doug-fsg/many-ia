'use server'

import { auth } from '@/services/auth'
import { prisma } from '@/services/database'

export async function getUserInteractions() {
  console.log('getUserInteractions foi chamada')
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        error: 'Usuário não autenticado',
        data: null,
      }
    }

    console.log('Iniciando busca de interações')
    const interactions = await prisma.interaction.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        lastContactAt: 'desc',
      },
    })
    console.log(
      'Interações encontradas:',
      JSON.stringify(interactions, null, 2),
    )
    if (interactions.length === 0) {
      console.log('Nenhuma interação encontrada para o usuário')
    }
    return {
      error: null,
      data: interactions,
    }
  } catch (error) {
    console.error('Erro ao buscar interações:', error)
    return {
      error: 'Erro ao buscar interações: ' + (error as Error).message,
      data: null,
    }
  }
}

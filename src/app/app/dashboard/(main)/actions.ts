'use server'

import { auth } from '@/services/auth'
import { prisma } from '@/services/database'

export async function getUserInteractions() {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      error: 'Usuário não autenticado',
      data: null,
    }
  }

  try {
    const interactions = await prisma.interaction.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        lastContactAt: 'desc',
      },
      include: {
        user: {
          select: {
            manytalksAccountId: true, // Selecionar apenas a coluna desejada
          },
        },
      },
    })
    // Converta objetos Decimal para valores numéricos
    const interactionsWithPlainValues = interactions.map((interaction) => ({
      ...interaction,
      value: interaction.value?.toNumber() || 0, // Converta o Decimal para número e trate valores nulos
      manytalksAccountId: interaction.user?.manytalksAccountId || null, // Adicione o campo manytalksAccountId
    }));
    return {
      error: null,
      data: interactionsWithPlainValues,
    };
  } catch (error) {
    return {
      error: 'Erro ao buscar interações: ' + (error as Error).message,
      data: null,
    };
  }
}

// Função para calcular créditos
export async function calculateCredits() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: 'Usuário não autenticado',
      totalCreditsMonth: 0,
      totalCreditsWeek: 0,
      remainingCredits: 0,
    };
  }

  const userId = session.user.id;
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));

  try {
    // Total de Créditos no Mês
    const totalMonth = await prisma.interaction.aggregate({
      _sum: {
        value: true,
      },
      where: {
        userId,
        updatedAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // Total de Créditos na Semana
    const totalWeek = await prisma.interaction.aggregate({
      _sum: {
        value: true,
      },
      where: {
        userId,
        updatedAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    // Crédito Restante
    const creditosIniciais = 10000; // Defina aqui o valor inicial de créditos
    const creditosRestantes =
      creditosIniciais - (totalMonth._sum.value?.toNumber() || 0);

    return {
      error: null,
      totalCreditsMonth: totalMonth._sum.value?.toNumber() || 0, // Converta para número
      totalCreditsWeek: totalWeek._sum.value?.toNumber() || 0,   // Converta para número
      remainingCredits: creditosRestantes,
    };
  } catch (error) {
    console.error('Erro ao calcular créditos:', error);
    return {
      error: 'Erro ao calcular créditos',
      totalCreditsMonth: 0,
      totalCreditsWeek: 0,
      remainingCredits: 0,
    };
  }
}

// Função para calcular atendimentos semanais e mensais
export async function calculateInteractions() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: 'Usuário não autenticado',
      weeklyInteractions: 0,
      monthlyInteractions: 0,
    };
  }

  const userId = session.user.id;
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));

  try {
    // Contagem de atendimentos na semana
    const weeklyInteractions = await prisma.interaction.count({
      where: {
        userId,
        updatedAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    // Contagem de atendimentos no mês
    const monthlyInteractions = await prisma.interaction.count({
      where: {
        userId,
        updatedAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    return {
      error: null,
      weeklyInteractions,
      monthlyInteractions,
    };
  } catch (error) {
    console.error('Erro ao calcular interações:', error);
    return {
      error: 'Erro ao calcular interações',
      weeklyInteractions: 0,
      monthlyInteractions: 0,
    };
  }
}



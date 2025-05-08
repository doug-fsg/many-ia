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

// Definição de tipos para melhorar a tipagem
interface DailyUsage {
  date: Date;
  value: number;
}

interface CreditHistoryItem {
  date: Date;
  total: string | number;
}

interface CreditResult {
  error: string | null;
  totalCreditsMonth: number;
  totalCreditsWeek: number;
  remainingCredits: number;
  creditHistory: CreditHistoryItem[];
  averageDailyUsage: number;
  estimatedDaysRemaining: number;
  creditTrend: 'increasing' | 'decreasing' | 'stable';
  highUsageDays: DailyUsage[];
  lastUpdated?: string;
}

// Função para calcular créditos
export async function calculateCredits(): Promise<CreditResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: 'Usuário não autenticado',
      totalCreditsMonth: 0,
      totalCreditsWeek: 0,
      remainingCredits: 0,
      creditHistory: [],
      averageDailyUsage: 0,
      estimatedDaysRemaining: 0,
      creditTrend: 'stable',
      highUsageDays: [],
    };
  }

  const userId = session.user.id;
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Corrigindo o cálculo de início e fim da semana
  const currentDate = new Date(now);
  const dayOfWeek = currentDate.getDay(); // 0 = domingo, 1 = segunda, etc.
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Data de 30 dias atrás para análise de tendência
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

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

    // Histórico de uso de créditos por dia nos últimos 30 dias
    const creditHistory = await prisma.$queryRaw`
      SELECT 
        DATE("updatedAt") as date,
        SUM(CAST(value as DECIMAL(10,2))) as total
      FROM "Interaction"
      WHERE "userId" = ${userId}
        AND "updatedAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("updatedAt")
      ORDER BY date ASC
    ` as CreditHistoryItem[];

    // Calcular média de uso diário (considerando apenas dias com uso)
    let totalDailyUsage = 0;
    let daysWithUsage = 0;
    
    const highUsageDays: DailyUsage[] = [];
    
    creditHistory.forEach((day) => {
      // Garantir que o valor seja um número, independente do tipo original
      const totalValue = typeof day.total === 'string' 
        ? parseFloat(day.total) 
        : Number(day.total);
      
      totalDailyUsage += totalValue;
      daysWithUsage++;
      
      // Identificar dias com uso acima da média (para alerta)
      if (totalValue > 500) { // Limiar arbitrário, ajuste conforme necessário
        highUsageDays.push({
          date: day.date,
          value: totalValue
        });
      }
    });
    
    const averageDailyUsage = daysWithUsage > 0 ? totalDailyUsage / daysWithUsage : 0;
    
    // Estimar dias restantes com base na média de uso
    const estimatedDaysRemaining = averageDailyUsage > 0 
      ? Math.floor(creditosRestantes / averageDailyUsage)
      : 30; // Valor padrão se não houver uso
    
    // Análise de tendência (comparando primeira e segunda quinzena)
    const firstHalfUsage = await prisma.interaction.aggregate({
      _sum: {
        value: true,
      },
      where: {
        userId,
        updatedAt: {
          gte: new Date(thirtyDaysAgo.getTime()),
          lt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        },
      },
    });
    
    const secondHalfUsage = await prisma.interaction.aggregate({
      _sum: {
        value: true,
      },
      where: {
        userId,
        updatedAt: {
          gte: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          lte: now,
        },
      },
    });
    
    const firstHalfTotal = firstHalfUsage._sum.value?.toNumber() || 0;
    const secondHalfTotal = secondHalfUsage._sum.value?.toNumber() || 0;
    
    // Determinar tendência
    let creditTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalfTotal > firstHalfTotal * 1.2) {
      creditTrend = 'increasing'; // Aumento de 20% ou mais
    } else if (secondHalfTotal < firstHalfTotal * 0.8) {
      creditTrend = 'decreasing'; // Diminuição de 20% ou mais
    }

    return {
      error: null,
      totalCreditsMonth: totalMonth._sum.value?.toNumber() || 0,
      totalCreditsWeek: totalWeek._sum.value?.toNumber() || 0,
      remainingCredits: creditosRestantes,
      creditHistory,
      averageDailyUsage,
      estimatedDaysRemaining,
      creditTrend,
      highUsageDays,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro ao calcular créditos:', error);
    return {
      error: 'Erro ao calcular créditos',
      totalCreditsMonth: 0,
      totalCreditsWeek: 0,
      remainingCredits: 0,
      creditHistory: [],
      averageDailyUsage: 0,
      estimatedDaysRemaining: 0,
      creditTrend: 'stable',
      highUsageDays: [],
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
  
  // Corrigindo o cálculo de início e fim da semana
  const currentDate = new Date(now);
  const dayOfWeek = currentDate.getDay(); // 0 = domingo, 1 = segunda, etc.
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

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



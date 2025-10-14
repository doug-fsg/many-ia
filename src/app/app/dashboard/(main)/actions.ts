'use server'

import { auth } from '@/services/auth'
import { prisma } from '@/services/database'

export async function getUserInteractions(params?: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  period?: 'month' | 'week' | 'custom';
  minInteractions?: number;
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      error: 'Usuário não autenticado',
      data: null,
    }
  }

  try {
    // Determinar período baseado no parâmetro ou usar "este mês" como padrão
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    if (params?.period === 'week') {
      // Últimos 7 dias
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      endDate = now;
    } else if (params?.period === 'custom' && params?.startDate && params?.endDate) {
      // Período personalizado
      startDate = params.startDate;
      endDate = params.endDate;
    } else {
      // Padrão: Este mês
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // Buscar TODAS as interações do período (sem limite)
    const interactions = await prisma.interaction.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      orderBy: {
        lastContactAt: 'desc',
      },
      include: {
        user: {
          select: {
            manytalksAccountId: true,
          },
        },
      },
    })

    // Agrupar por ConversationID para eliminar duplicatas
    const groupedInteractions = new Map();
    
    interactions.forEach((interaction) => {
      // Tentar agrupar por ConversationID primeiro, depois por telefone + nome
      const conversationId = interaction.ConversationID || `${interaction.phoneNumber}-${interaction.name}` || interaction.id;
      
      if (!groupedInteractions.has(conversationId)) {
        // Primeira ocorrência desta conversa
        groupedInteractions.set(conversationId, {
          ...interaction,
          value: interaction.value?.toNumber() || 0,
          manytalksAccountId: interaction.user?.manytalksAccountId || null,
        });
      } else {
        // Somar valores da mesma conversa
        const existing = groupedInteractions.get(conversationId);
        existing.value += interaction.value?.toNumber() || 0;
        
        // Manter a data de contato mais recente
        if (new Date(interaction.updatedAt || 0) > new Date(existing.lastContactAt || 0)) {
          existing.lastContactAt = interaction.updatedAt;
          existing.lastMessage = interaction.lastMessage;
          existing.status = interaction.status;
        }
        
        // Somar interactionsCount (igual ao cálculo de créditos do mês)
        existing.interactionsCount = (existing.interactionsCount || 0) + (interaction.interactionsCount || 0);
      }
    });

    // Converter Map para Array, aplicar filtros e ordenar por data mais recente
    let uniqueInteractions = Array.from(groupedInteractions.values());
    
    // Filtrar por número mínimo de interações se especificado
    if (params?.minInteractions && params.minInteractions > 0) {
      uniqueInteractions = uniqueInteractions.filter(
        interaction => (interaction.interactionsCount || 0) >= params.minInteractions!
      );
    }
    
    // Ordenar por data mais recente
    uniqueInteractions.sort((a, b) => new Date(b.lastContactAt || 0).getTime() - new Date(a.lastContactAt || 0).getTime());

    console.log(`[INTERACTIONS] Performance: ${interactions.length} interações agrupadas em ${uniqueInteractions.length} conversas únicas`);
    console.log(`[INTERACTIONS] Período: ${startDate.toISOString().split('T')[0]} até ${endDate.toISOString().split('T')[0]}`);
    if (params?.minInteractions) {
      console.log(`[INTERACTIONS] Filtro mín. interações: ${params.minInteractions}`);
    }

    return {
      error: null,
      data: uniqueInteractions,
      metadata: {
        totalInteractions: interactions.length,
        uniqueConversations: uniqueInteractions.length,
        periodStart: startDate,
        periodEnd: endDate,
        limitApplied: null,
        period: params?.period || 'month',
        minInteractions: params?.minInteractions
      }
    };
  } catch (error) {
    console.error('[INTERACTIONS] Erro ao buscar interações:', error);
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
export async function calculateCredits(params?: {
  startDate?: Date;
  endDate?: Date;
  period?: 'month' | 'week' | 'custom';
}): Promise<CreditResult> {
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
  
  // Determinar período baseado nos parâmetros ou usar padrão
  let firstDayOfMonth: Date;
  let lastDayOfMonth: Date;
  let startOfWeek: Date;
  let endOfWeek: Date;
  
  if (params?.period === 'custom' && params?.startDate && params?.endDate) {
    // Período personalizado
    firstDayOfMonth = params.startDate;
    lastDayOfMonth = params.endDate;
    startOfWeek = params.startDate;
    endOfWeek = params.endDate;
  } else if (params?.period === 'week') {
    // Últimos 7 dias
    const currentDate = new Date(now);
    const dayOfWeek = currentDate.getDay();
    startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Para semana, usar os mesmos valores para mês
    firstDayOfMonth = startOfWeek;
    lastDayOfMonth = endOfWeek;
  } else {
    // Padrão: Este mês
    firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Calcular semana atual
    const currentDate = new Date(now);
    const dayOfWeek = currentDate.getDay();
    startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
  }

  // Data de 30 dias atrás para análise de tendência
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  try {
    // Total de Créditos no Mês
    const totalMonth = await prisma.interaction.aggregate({
      _sum: {
        interactionsCount: true,
      },
      where: {
        userId,
        createdAt: {  // ← MUDANÇA: createdAt para evitar cobrança dupla
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // Total de Créditos na Semana
    const totalWeek = await prisma.interaction.aggregate({
      _sum: {
        interactionsCount: true,
      },
      where: {
        userId,
        createdAt: {  // ← MUDANÇA: createdAt para evitar cobrança dupla
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    // Crédito Restante - buscar limite do plano do usuário
    let creditosIniciais = 10000; // Valor padrão como fallback
    try {
      const { getUserCurrentPlan } = await import('@/services/stripe');
      const plan = await getUserCurrentPlan(userId);
      creditosIniciais = plan.quota.credits?.available || 10000;
    } catch (error) {
      console.error('[CREDITS] Erro ao buscar limite do usuário, usando padrão:', error);
      creditosIniciais = 10000; // Fallback seguro
    }
    
    const creditosRestantes =
      creditosIniciais - (totalMonth._sum.interactionsCount || 0);

    // Histórico de uso de créditos por dia nos últimos 30 dias
    const creditHistory = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        SUM(CAST(value as DECIMAL(10,2))) as total
      FROM "Interaction"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
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
      totalCreditsMonth: totalMonth._sum.interactionsCount || 0,
      totalCreditsWeek: totalWeek._sum.interactionsCount || 0,
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

// Função para calcular clientes únicos atendidos semanais e mensais
export async function calculateInteractions(params?: {
  startDate?: Date;
  endDate?: Date;
  period?: 'month' | 'week' | 'custom';
}) {
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
  
  // Determinar período baseado nos parâmetros ou usar padrão
  let firstDayOfMonth: Date;
  let lastDayOfMonth: Date;
  let startOfWeek: Date;
  let endOfWeek: Date;
  
  if (params?.period === 'custom' && params?.startDate && params?.endDate) {
    // Período personalizado
    firstDayOfMonth = params.startDate;
    lastDayOfMonth = params.endDate;
    startOfWeek = params.startDate;
    endOfWeek = params.endDate;
  } else if (params?.period === 'week') {
    // Últimos 7 dias
    const currentDate = new Date(now);
    const dayOfWeek = currentDate.getDay();
    startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Para semana, usar os mesmos valores para mês
    firstDayOfMonth = startOfWeek;
    lastDayOfMonth = endOfWeek;
  } else {
    // Padrão: Este mês
    firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Calcular semana atual
    const currentDate = new Date(now);
    const dayOfWeek = currentDate.getDay();
    startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
  }

  try {
    // Buscar todas as interações da semana para contar clientes únicos
    const weeklyInteractionsData = await prisma.interaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      select: {
        phoneNumber: true,
      },
    });

    // Buscar todas as interações do mês para contar clientes únicos
    const monthlyInteractionsData = await prisma.interaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      select: {
        phoneNumber: true,
      },
    });

    // Função para contar clientes únicos baseado apenas no phoneNumber
    const countUniqueClients = (interactions: Array<{ phoneNumber: string | null }>) => {
      const uniquePhones = new Set<string>();
      
      interactions.forEach((interaction) => {
        // Usar apenas phoneNumber como identificador único
        if (interaction.phoneNumber) {
          uniquePhones.add(interaction.phoneNumber);
        }
      });
      
      return uniquePhones.size;
    };

    const weeklyUniqueClients = countUniqueClients(weeklyInteractionsData);
    const monthlyUniqueClients = countUniqueClients(monthlyInteractionsData);

    console.log(`[INTERACTIONS] Clientes únicos por telefone - Semana: ${weeklyUniqueClients}, Mês: ${monthlyUniqueClients}`);

    return {
      error: null,
      weeklyInteractions: weeklyUniqueClients,
      monthlyInteractions: monthlyUniqueClients,
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

// Função otimizada para calcular estatísticas agregadas diretamente no banco
export async function getInteractionStats() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: 'Usuário não autenticado',
      data: null,
    };
  }

  const userId = session.user.id;
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  try {
    // Usar agregação SQL para performance máxima
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT "ConversationID") as unique_conversations,
        SUM("interactionsCount") as total_interactions,
        COALESCE(SUM(CAST("value" as DECIMAL(10,2))), 0) as total_credits,
        SUM(CASE WHEN "createdAt" >= ${firstDayOfMonth} AND "createdAt" <= ${lastDayOfMonth} THEN "interactionsCount" ELSE 0 END) as monthly_interactions,
        COALESCE(SUM(CASE WHEN "createdAt" >= ${firstDayOfMonth} AND "createdAt" <= ${lastDayOfMonth} THEN CAST("value" as DECIMAL(10,2)) ELSE 0 END), 0) as monthly_credits
      FROM "Interaction"
      WHERE "userId" = ${userId} 
        AND "ConversationID" IS NOT NULL
        AND "createdAt" >= NOW() - INTERVAL '6 months'
    ` as Array<{
      unique_conversations: bigint;
      total_interactions: bigint;
      total_credits: number;
      monthly_interactions: bigint;
      monthly_credits: number;
    }>;

    const result = stats[0];
    
    return {
      error: null,
      data: {
        uniqueConversations: Number(result.unique_conversations),
        totalInteractions: Number(result.total_interactions),
        totalCredits: Number(result.total_credits),
        monthlyInteractions: Number(result.monthly_interactions),
        monthlyCredits: Number(result.monthly_credits),
      }
    };
  } catch (error) {
    console.error('[STATS] Erro ao calcular estatísticas:', error);
    return {
      error: 'Erro ao calcular estatísticas: ' + (error as Error).message,
      data: null,
    };
  }
}



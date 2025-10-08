import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { stripe } from '@/services/stripe'

// Função para obter o valor da mensalidade baseado no stripePriceId
async function getMonthlySubscription(stripePriceId: string | null): Promise<number> {
  if (!stripePriceId) return 0
  
  try {
    const price = await stripe.prices.retrieve(stripePriceId)
    return (price.unit_amount || 0) / 100 // Stripe armazena em centavos
  } catch (error) {
    console.error('Erro ao buscar preço do Stripe:', error)
    return 0
  }
}

export async function GET(request: NextRequest) {
  try {
    // Em uma implementação real, você verificaria o token de super admin aqui
    // Por simplicidade, vamos apenas retornar os dados

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')
    
    let startOfMonth: Date
    let endOfMonth: Date
    
    if (monthParam) {
      // Parse do parâmetro month (formato: YYYY-MM)
      const [year, month] = monthParam.split('-').map(Number)
      startOfMonth = new Date(year, month - 1, 1)
      endOfMonth = new Date(year, month, 0) // Último dia do mês
    } else {
      // Usar mês atual como padrão
      const currentDate = new Date()
      startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    }

    // Buscar todos os usuários com suas interações do mês atual
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        customCreditLimit: true,
        stripePriceId: true,
        stripeSubscriptionStatus: true,
        interactions: {
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        },
        _count: {
          select: {
            interactions: true
          }
        }
      },
      orderBy: [
        {
          stripeSubscriptionStatus: 'desc'
        },
        {
          email: 'asc'
        }
      ]
    })

    // Processar dados dos clientes
    const clients = await Promise.all(users.map(async user => {
      // Somar todos os interactionsCount das interações do mês
      const monthlyInteractions = user.interactions.reduce((sum, interaction) => {
        return sum + (interaction.interactionsCount || 0)
      }, 0)
      
      const monthlyValue = user.interactions.reduce((sum, interaction) => {
        return sum + (interaction.value ? parseFloat(interaction.value.toString()) : 0)
      }, 0)

      const creditLimit = user.customCreditLimit || 10000
      const usagePercentage = (monthlyInteractions / creditLimit) * 100
      const isOverLimit = monthlyInteractions > creditLimit

      // Última atividade
      const lastActivity = user.interactions.length > 0 
        ? user.interactions.reduce((latest, interaction) => {
            return interaction.updatedAt > latest ? interaction.updatedAt : latest
          }, user.interactions[0].updatedAt)
        : null

      const monthlySubscription = await getMonthlySubscription(user.stripePriceId)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        customCreditLimit: user.customCreditLimit,
        monthlyInteractions,
        monthlyValue,
        monthlySubscription,
        totalInteractions: user._count.interactions,
        totalValue: 0, // Você pode calcular o valor total se necessário
        stripeSubscriptionStatus: user.stripeSubscriptionStatus,
        usagePercentage: Math.min(usagePercentage, 100),
        isOverLimit,
        lastActivity
      }
    }))

    // Calcular estatísticas
    const stats = {
      totalClients: users.length,
      activeClients: users.filter(user => user.stripeSubscriptionStatus === 'active').length,
      totalMonthlyInteractions: clients.reduce((sum, client) => sum + client.monthlyInteractions, 0),
      totalMonthlyValue: clients.reduce((sum, client) => sum + client.monthlyValue, 0),
      clientsOverLimit: clients.filter(client => client.isOverLimit).length
    }

    return NextResponse.json({
      success: true,
      clients,
      stats
    })

  } catch (error) {
    console.error('Erro ao buscar dados dos clientes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')
    
    let startOfMonth: Date
    
    if (monthParam) {
      // Parse do parâmetro month (formato: YYYY-MM)
      const [year, month] = monthParam.split('-').map(Number)
      startOfMonth = new Date(year, month - 1, 1)
    } else {
      // Usar mês atual como padrão
      const currentDate = new Date()
      startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    }
    const user = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 50 // Últimas 50 interações
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Filtrar interações do mês atual
    const monthlyInteractions = user.interactions.filter(interaction => 
      interaction.createdAt >= startOfMonth
    )

    // Calcular estatísticas mensais
    const monthlyStats = {
      interactions: monthlyInteractions.reduce((sum, interaction) => {
        return sum + (interaction.interactionsCount || 0)
      }, 0),
      value: monthlyInteractions.reduce((sum, interaction) => {
        return sum + (interaction.value ? parseFloat(interaction.value.toString()) : 0)
      }, 0),
      usagePercentage: ((monthlyInteractions.reduce((sum, interaction) => {
        return sum + (interaction.interactionsCount || 0)
      }, 0) / (user.customCreditLimit || 10000)) * 100)
    }

    // Preparar interações recentes para exibição
    const recentInteractions = user.interactions.slice(0, 20).map(interaction => ({
      id: interaction.id,
      name: interaction.name,
      phoneNumber: interaction.phoneNumber,
      value: interaction.value ? parseFloat(interaction.value.toString()) : 0,
      createdAt: interaction.createdAt,
      status: interaction.status
    }))

    // Calcular histórico mensal (últimos 6 meses)
    const monthlyHistory = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0)
      
      const monthInteractions = user.interactions.filter(interaction => 
        interaction.createdAt >= monthStart && interaction.createdAt <= monthEnd
      )

      const monthInteractionsCount = monthInteractions.reduce((sum, interaction) => {
        return sum + (interaction.interactionsCount || 0)
      }, 0)

      const monthValue = monthInteractions.reduce((sum, interaction) => {
        return sum + (interaction.value ? parseFloat(interaction.value.toString()) : 0)
      }, 0)

      monthlyHistory.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        interactions: monthInteractionsCount,
        value: monthValue
      })
    }

    const clientDetails = {
      id: user.id,
      name: user.name,
      email: user.email,
      customCreditLimit: user.customCreditLimit,
      stripeSubscriptionStatus: user.stripeSubscriptionStatus,
      monthlyStats,
      recentInteractions,
      monthlyHistory
    }

    return NextResponse.json({
      success: true,
      client: clientDetails
    })

  } catch (error) {
    console.error('Erro ao buscar dados do cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

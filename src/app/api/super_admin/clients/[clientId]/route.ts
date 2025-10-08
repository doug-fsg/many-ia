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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    
    const currentDate = new Date()
    let startOfMonth: Date
    let endOfMonth: Date
    
    if (monthParam) {
      // Parse do parâmetro month (formato: YYYY-MM)
      const [year, month] = monthParam.split('-').map(Number)
      startOfMonth = new Date(year, month - 1, 1)
      endOfMonth = new Date(year, month, 0) // Último dia do mês
    } else {
      // Usar mês atual como padrão
      startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    }
    const user = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        interactions: {
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        },
        _count: {
          select: {
            interactions: true
          }
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
      interaction.createdAt >= startOfMonth && interaction.createdAt <= endOfMonth
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
    const recentInteractions = user.interactions.map(interaction => ({
      id: interaction.id,
      name: interaction.name,
      phoneNumber: interaction.phoneNumber,
      value: interaction.value ? parseFloat(interaction.value.toString()) : 0,
      createdAt: interaction.createdAt,
      status: interaction.status
    }))

    // Calcular informações de paginação
    const totalInteractions = user._count.interactions
    const totalPages = Math.ceil(totalInteractions / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

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
      monthlyHistory,
      pagination: {
        currentPage: page,
        totalPages,
        totalInteractions,
        hasNextPage,
        hasPrevPage,
        limit
      }
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

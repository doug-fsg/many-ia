import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/database'

// Configuração para marcar a rota como dinâmica
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    
    // Verificar se o usuário está autenticado
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }
    
    // Verificar se o usuário é da integração
    if (session.user.isIntegrationUser) {
      return NextResponse.json(
        [], 
        { status: 200 }
      )
    }
    
    // Buscar todas as conexões do usuário
    const connections = await prisma.whatsAppConnection.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    // Retorna o array de conexões (vazio ou com itens)
    return NextResponse.json(connections)
  } catch (error) {
    console.error('Erro ao buscar conexões do WhatsApp:', error)
    // Em caso de erro de banco de dados, retornar array vazio em vez de erro
    // para não afetar a interface do usuário
    return NextResponse.json(
      [], 
      { status: 200 }
    )
  }
} 
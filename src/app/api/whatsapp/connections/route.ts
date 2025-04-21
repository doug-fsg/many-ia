import { NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/database'

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
        { error: 'Esta funcionalidade não está disponível para usuários da integração' }, 
        { status: 403 }
      )
    }
    
    // Buscar todas as conexões do usuário incluindo informação da IA
    const connections = await prisma.whatsAppConnection.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        aiConfig: {
          select: {
            id: true,
            nomeAtendenteDigital: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json(connections)
  } catch (error) {
    console.error('Erro ao buscar conexões do WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar conexões do WhatsApp' }, 
      { status: 500 }
    )
  }
} 
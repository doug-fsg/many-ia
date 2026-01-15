import { NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/database'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const iaId = params.id
    const session = await auth()
    
    // Verificar se o usuário está autenticado
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }
    
    // Verificar se o usuário não é da integração
    if (session.user.isIntegrationUser) {
      return NextResponse.json(
        { error: 'Funcionalidade não disponível para usuários de integração' }, 
        { status: 403 }
      )
    }
    
    // Verificar se a IA existe e pertence ao usuário
    const aiConfig = await prisma.aIConfig.findFirst({
      where: {
        id: iaId,
        userId: session.user.id,
      },
    })
    
    if (!aiConfig) {
      return NextResponse.json(
        { error: 'IA não encontrada ou não pertence ao usuário' }, 
        { status: 404 }
      )
    }
    
    // Buscar conexões vinculadas à IA usando SQL Raw para evitar problemas com relações não atualizadas no Prisma Client
    const connectionsQuery = `
      SELECT w.*
      FROM "WhatsAppConnection" w
      WHERE w."iaId" = $1 AND w."userId" = $2
      ORDER BY w."createdAt" DESC
    `;
    
    const connections = await prisma.$queryRawUnsafe(connectionsQuery, iaId, session.user.id);
    
    return NextResponse.json(connections)
  } catch (error) {
    console.error('Erro ao buscar conexões da IA:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar conexões da IA' }, 
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/database'

export async function POST(request: Request) {
  try {
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
    
    const body = await request.json()
    const { connectionId } = body
    
    if (!connectionId) {
      return NextResponse.json(
        { error: 'ID da conexão é obrigatório' }, 
        { status: 400 }
      )
    }
    
    // Verificar se a conexão existe e pertence ao usuário
    const connection = await prisma.whatsAppConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id,
      },
    })
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Conexão não encontrada ou não pertence ao usuário' }, 
        { status: 404 }
      )
    }
    
    // Remover o webhook na API externa
    const webhookResponse = await fetch(`http://173.249.22.227:31000/v3/bot/${connection.token}/webhook`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
    
    if (!webhookResponse.ok) {
      console.warn('Erro ao remover webhook na API externa, mas continuando com a desvinculação no banco')
    }
    
    // Desvincular a conexão da IA no banco de dados
    await prisma.whatsAppConnection.update({
      where: {
        id: connectionId,
      },
      data: {
        iaId: null,
        webhookConfigured: false,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao desvincular canal:', error)
    return NextResponse.json(
      { error: 'Erro interno ao desvincular canal' }, 
      { status: 500 }
    )
  }
} 
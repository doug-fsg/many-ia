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
    const { iaId, connectionId } = body
    
    if (!iaId || !connectionId) {
      return NextResponse.json(
        { error: 'IDs da IA e da conexão são obrigatórios' }, 
        { status: 400 }
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
    
    // Configurar o webhook na API externa
    const webhookResponse = await fetch(`http://173.249.22.227:31000/v3/bot/${connection.token}/webhook`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://n8n.manytalks.com.br/webhook-test/teste-ia',
        extra: {
          id: session.user.id,
          iaId: iaId,
          isIntegrationUser: "false"
        }
      })
    })
    
    if (!webhookResponse.ok) {
      return NextResponse.json(
        { error: 'Erro ao configurar webhook na API externa' },
        { status: 500 }
      )
    }
    
    // Vincular a conexão à IA no banco de dados
    await prisma.whatsAppConnection.update({
      where: {
        id: connectionId,
      },
      data: {
        iaId: iaId,
        webhookConfigured: true,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao vincular canal:', error)
    return NextResponse.json(
      { error: 'Erro interno ao vincular canal' }, 
      { status: 500 }
    )
  }
} 
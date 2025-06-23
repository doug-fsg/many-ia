import { NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/database'

// Tipo para representar a requisição recebida do frontend
type ChatTestRequest = Array<{
  fromme: boolean
  extra: {
    account: string
    inbox: string | number
    aiConfig?: any // Adicionado para incluir os dados do aiConfig
    isTemplate?: boolean // Adicionado para identificar se é um teste de template
  }
  chat: {
    id: string
  }
  id: string
  debug: boolean
  timestamp: string
  text: string
  type: string
}>

// Tipo para representar a resposta do n8n
type ChatTestResponse = Array<{
  text: string
  sessionId: string
}>

// Timeout para a requisição em milissegundos (30 segundos)
const TIMEOUT_MS = 30000

// Função para fazer fetch com timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number) => {
  const controller = new AbortController()
  const { signal } = controller
  
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }
    
    // Obter dados do usuário para o manytalksAccountId
    let manytalksAccountId = null
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { manytalksAccountId: true }
      })
      
      if (user?.manytalksAccountId) {
        manytalksAccountId = user.manytalksAccountId
      }
    } catch (error) {
      console.error('Erro ao buscar manytalksAccountId do usuário:', error)
    }
    
    // Obter dados da requisição
    const chatRequest: ChatTestRequest = await request.json()
    
    if (!Array.isArray(chatRequest) || chatRequest.length === 0) {
      return NextResponse.json(
        { error: 'Formato de requisição inválido' }, 
        { status: 400 }
      )
    }

    // Se for um teste de template, buscar o template ao invés do aiConfig
    if (chatRequest[0].extra.isTemplate) {
      const template = await prisma.template.findFirst({
        where: {
          id: chatRequest[0].id,
          OR: [
            { userId: session.user.id }, // Template do usuário
            { 
              sharedWith: {
                some: { userId: session.user.id } // Template compartilhado com o usuário
              }
            }
          ]
        },
        include: {
          sharedWith: true
        }
      })

      if (!template) {
        return NextResponse.json(
          { error: 'Template não encontrado ou sem permissão de acesso' },
          { status: 404 }
        )
      }

      // Adicionar os dados do template ao payload
      chatRequest[0].extra.aiConfig = {
        ...template,
        isTemplate: true
      }
    } else {
      // Buscar o aiConfig específico pelo ID enviado no payload
      const aiConfig = await prisma.aIConfig.findFirst({
        where: {
          id: chatRequest[0].id,
          userId: session.user.id
        },
        include: {
          attachments: true,
          temasEvitar: true
        }
      })

      if (!aiConfig) {
        return NextResponse.json(
          { error: 'Configuração de IA não encontrada ou sem permissão de acesso' },
          { status: 404 }
        )
      }

      // Remover o campo embedding do aiConfig
      const { embedding, ...aiConfigWithoutEmbedding } = aiConfig
      
      // Adicionar os dados do aiConfig ao payload
      chatRequest[0].extra.aiConfig = aiConfigWithoutEmbedding
    }
    
    // Se temos um manytalksAccountId, atualizar o payload
    if (manytalksAccountId) {
      chatRequest[0].extra.account = manytalksAccountId
    }
    
    try {
      // Enviar requisição para o webhook do n8n com timeout
      const response = await fetchWithTimeout(
        'https://n8n.manytalks.com.br/webhook/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chatRequest),
        },
        TIMEOUT_MS
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro na resposta do webhook:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        
        throw new Error(`Erro na resposta do webhook: ${response.status} ${response.statusText}`)
      }
      
      const responseData: ChatTestResponse = await response.json()
      
      // Retornar a resposta para o frontend
      return NextResponse.json(responseData)
    } catch (error) {
      console.error('Erro na comunicação com o webhook:', error)
      
      // Tratamento específico para timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          [{ 
            text: 'O tempo de resposta do agente expirou. Por favor, tente novamente com uma pergunta mais simples.',
            sessionId: chatRequest[0].chat.id
          }],
          { status: 200 } // Retornamos 200 para ser tratado como mensagem no frontend
        )
      }
      
      // Outros erros de comunicação
      return NextResponse.json(
        [{ 
          text: 'Ocorreu um erro ao processar sua mensagem. O serviço de IA pode estar temporariamente indisponível.',
          sessionId: chatRequest[0].chat.id
        }],
        { status: 200 } // Retornamos 200 para ser tratado como mensagem no frontend
      )
    }
  } catch (error) {
    console.error('Erro ao processar teste de chat:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao processar teste de chat' }, 
      { status: 500 }
    )
  }
} 
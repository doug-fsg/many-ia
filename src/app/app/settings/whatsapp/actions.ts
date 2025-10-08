'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/services/auth'
import { prisma } from '@/services/database'
import crypto from 'crypto'

// Define tipos para WhatsAppConnection
type WhatsAppConnection = {
  id: string
  token: string
  phoneNumber: string | null
  name: string | null
  isActive: boolean
  webhookConfigured: boolean
  qrCodeUrl: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
}

// Definição do tipo de conexão estendida para incluir campos da IA
type WhatsAppConnectionWithAI = WhatsAppConnection & {
  aiConfigId?: string | null;
  nomeAtendenteDigital?: string | null;
};

// Função para gerar um token aleatório
function generateRandomToken() {
  // Gerar string aleatória com 20 caracteres
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  // Prefixar com 'IA-'
  return `IA-${result}`;
}

// Função para gerar um QR Code para uma nova conexão
export async function generateQRCode(userId: string, connectionName: string) {
  try {
    const session = await auth()
    
    // Verificar se o usuário está autenticado
    if (!session?.user?.id || session.user.id !== userId) {
      return {
        error: 'Usuário não autorizado',
        data: null,
      }
    }

    // Verificar se o usuário é da integração
    if (session.user.isIntegrationUser) {
      return {
        error: 'Esta funcionalidade não está disponível para usuários da integração',
        data: null,
      }
    }

    // Gerar token aleatório para a conexão do WhatsApp
    const token = generateRandomToken();
    console.log('Token gerado:', token);

    // Verificar se já existe uma conexão com este token
    const existingConnections = await prisma.$queryRaw<WhatsAppConnection[]>`
      SELECT * FROM "WhatsAppConnection"
      WHERE "token" = ${token}
      LIMIT 1
    `

    if (existingConnections && existingConnections.length > 0) {
      // Se já existe, retornar erro
      return {
        error: 'Já existe uma conexão com este token. Por favor, use um nome diferente.',
        data: null,
      }
    }

    console.log('Iniciando requisição para obter QR code do WhatsApp...');
    
    // Fazer a requisição para gerar o QR Code
    const response = await fetch('http://173.249.22.227:31000/scan', {
      method: 'GET',
      headers: {
        'X-QUEPASA-TOKEN': token,
        'X-QUEPASA-USER': 'doug.fsg@gmail.com', // Email fixo requerido pela API
      },
    });

    console.log('Resposta HTTP:', response.status, response.statusText, response.headers.get('content-type'));

    if (!response.ok) {
      throw new Error(`Erro ao gerar QR Code: ${response.statusText}`)
    }

    // Verificar o tipo de conteúdo da resposta
    const contentType = response.headers.get('content-type');
    let qrCodeUrl;

    if (contentType && contentType.includes('image/png')) {
      console.log('Recebido conteúdo em formato PNG. Convertendo para base64...');
      
      // Ler a resposta como um blob
      const blob = await response.blob();
      
      // Converter o blob para base64
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);
      
      console.log('Imagem convertida para base64, tamanho:', base64Data.length);
      qrCodeUrl = `data:image/png;base64,${base64Data}`;
    } else {
      // Se não for uma imagem, tentar processar como texto como antes
      console.log('Recebido conteúdo em formato texto.');
      const qrCodeData = await response.text();
      console.log('Resposta recebida, comprimento:', qrCodeData.length);
      
      // Logar os primeiros e últimos caracteres do QR code para diagnóstico
      if (qrCodeData && qrCodeData.length > 0) {
        const start = qrCodeData.substring(0, Math.min(50, qrCodeData.length));
        const end = qrCodeData.substring(Math.max(0, qrCodeData.length - 50));
        console.log('Início do QR code:', start);
        console.log('Final do QR code:', end);
      }
      
      // Validar a resposta
      if (!qrCodeData || qrCodeData.trim().length < 100) {
        console.error('QR Code inválido ou muito curto:', qrCodeData);
        return {
          error: 'Servidor retornou um QR code inválido. Tente novamente mais tarde.',
          data: null,
        }
      }

      // Formatar a URL do QR Code
      if (qrCodeData.trim().startsWith('data:image/png;base64,')) {
        console.log('QR code já contém prefixo data:image/png;base64,');
        qrCodeUrl = qrCodeData.trim();
      } else {
        console.log('Adicionando prefixo data:image/png;base64, ao QR code');
        qrCodeUrl = `data:image/png;base64,${qrCodeData.trim()}`;
      }
    }

    // Não salvamos mais a conexão no banco neste ponto
    // Apenas retornamos os dados para o frontend

    console.log('QR code gerado com sucesso para token:', token);

    return {
      data: {
        token: token,
        connectionName: connectionName,
        qrCodeUrl: qrCodeUrl,
        userId: session.user.id,
      },
      error: null,
    }
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro ao gerar QR Code',
      data: null,
    }
  }
}

// Verificar se a conexão foi estabelecida com sucesso e salvar no banco se foi
export async function verifyConnection(token: string, connectionName: string, userId: string) {
  try {
    console.log('Iniciando verificação de conexão para token:', token);
    const session = await auth()
    
    // Verificar se o usuário está autenticado
    if (!session?.user?.id) {
      return {
        error: 'Usuário não autorizado',
        data: null,
      }
    }

    // Verificar se já existe uma conexão com este token
    const existingConnections = await prisma.$queryRaw<WhatsAppConnection[]>`
      SELECT * FROM "WhatsAppConnection"
      WHERE "token" = ${token}
      LIMIT 1
    `

    let connectionId = null;
    
    if (existingConnections && existingConnections.length > 0) {
      connectionId = existingConnections[0].id;
      console.log('Conexão já existe no banco, ID:', connectionId);
    }

    // Garantir que o token não tem espaços extras
    const cleanToken = token.trim();
    
    // Construir a URL para verificação da conexão
    const url = `http://173.249.22.227:31000/v3/bot/${cleanToken}`;
    
    console.log('==== DETALHES DA REQUISIÇÃO DE VERIFICAÇÃO ====');
    console.log('URL:', url);
    console.log('Token sendo verificado:', cleanToken);
    console.log('Horário da requisição:', new Date().toISOString());
    
    // Fazer a requisição para verificar a conexão
    let response;
    try {
      console.log('Iniciando requisição HTTP...');
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Adicionar um timeout para não esperar indefinidamente
        signal: AbortSignal.timeout(10000), // 10 segundos de timeout
        // Desabilitar cache para garantir resposta fresca
        cache: 'no-store',
      });
      
      console.log('Requisição HTTP concluída');
      console.log('Status HTTP:', response.status, response.statusText);
      console.log('Content-Type:', response.headers.get('content-type'));
      console.log('Content-Length:', response.headers.get('content-length'));
      
    } catch (fetchError) {
      console.error('ERRO NA REQUISIÇÃO HTTP:', fetchError);
      return {
        error: `Erro ao conectar com o servidor: ${fetchError instanceof Error ? fetchError.message : 'Erro desconhecido'}`,
        data: null,
      }
    }

    if (!response.ok) {
      console.error('RESPOSTA HTTP NÃO-OK:', response.status, response.statusText);
      try {
        const errorText = await response.text();
        console.error('Conteúdo da resposta de erro:', errorText);
      } catch (e) {
        console.error('Não foi possível ler o conteúdo da resposta de erro');
      }
      
      throw new Error(`Erro ao verificar conexão: ${response.status} ${response.statusText}`)
    }

    // Verificar se a resposta está vazia
    console.log('Lendo resposta da requisição...');
    const responseText = await response.text();
    console.log('Comprimento da resposta:', responseText.length);
    
    if (!responseText || responseText.trim() === '') {
      console.log('RESPOSTA VAZIA RECEBIDA!');
      return {
        error: 'Servidor retornou uma resposta vazia. Tente novamente em alguns segundos.',
        data: null,
      }
    }

    console.log('======== RESPOSTA DA VERIFICAÇÃO ========');
    console.log('Texto da resposta:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    // Tentar analisar a resposta JSON
    let connectionData;
    try {
      connectionData = JSON.parse(responseText);
      console.log('JSON parseado com sucesso, formato:', Array.isArray(connectionData) ? 'array' : typeof connectionData);
      console.log('Dados da conexão:', JSON.stringify(connectionData, null, 2));
    } catch (jsonError) {
      console.error('ERRO AO ANALISAR JSON DA RESPOSTA:', jsonError);
      console.error('Texto que causou o erro:', responseText);
      return {
        error: 'Resposta do servidor inválida. Tente novamente mais tarde.',
        data: null,
      }
    }

    // Verificar se a conexão foi estabelecida
    // Ajuste para verificar também o formato da resposta
    let isConnected = false;
    let serverData = null;
    
    if (Array.isArray(connectionData) && connectionData.length > 0) {
      isConnected = connectionData[0]?.success && 
                    connectionData[0]?.server?.verified === true;
      serverData = connectionData[0]?.server;
    } else if (connectionData?.success) {
      // Formato alternativo direto como objeto
      isConnected = connectionData.success && 
                    connectionData.server?.verified === true;
      serverData = connectionData.server;
    }
    
    console.log('Status da conexão - Conectado:', isConnected);
    
    let phoneNumber = null;
    
    // Se estiver conectado, salvar ou atualizar a conexão no banco
    if (isConnected) {
      // Extrair número de telefone do WID
      if (serverData?.wid) {
        phoneNumber = serverData.wid.split(':')[0]
        console.log('Número de telefone detectado:', phoneNumber);
      }
      
      // Se a conexão já existe, atualizar
      if (connectionId) {
        await prisma.$executeRaw`
          UPDATE "WhatsAppConnection"
          SET "phoneNumber" = ${phoneNumber}, "updatedAt" = NOW()
          WHERE "id" = ${connectionId}
        `
        console.log('Conexão existente atualizada no banco');
      } 
      // Se não existe, criar uma nova
      else {
        const id = crypto.randomUUID();
        const connections = await prisma.$queryRaw<WhatsAppConnection[]>`
          INSERT INTO "WhatsAppConnection" ("id", "token", "name", "userId", "phoneNumber", "createdAt", "updatedAt")
          VALUES (${id}, ${token}, ${connectionName}, ${session.user.id}, ${phoneNumber}, NOW(), NOW())
          RETURNING id
        `
        connectionId = connections[0].id;
        console.log('Nova conexão criada no banco, ID:', connectionId);
      }
    }

    return {
      data: {
        success: isConnected,
        server: serverData,
        dbId: connectionId,
        phoneNumber
      },
      error: null,
    }
  } catch (error) {
    console.error('Erro ao verificar conexão:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro ao verificar conexão',
      data: null,
    }
  }
}

// Configurar o webhook para a conexão
export async function configureWebhook(token: string, userId: string) {
  try {
    const session = await auth()
    
    // Verificar se o usuário está autenticado
    if (!session?.user?.id || session.user.id !== userId) {
      return {
        error: 'Usuário não autorizado',
        data: null,
      }
    }

    // Verificar se a conexão existe
    const connections = await prisma.$queryRaw<WhatsAppConnection[]>`
      SELECT * FROM "WhatsAppConnection"
      WHERE "token" = ${token} AND "userId" = ${session.user.id}
      LIMIT 1
    `

    if (!connections || connections.length === 0) {
      return {
        error: 'Conexão não encontrada',
        data: null,
      }
    }
    
    const connection = connections[0]

    // Fazer a requisição para configurar o webhook
    const response = await fetch(`http://173.249.22.227:31000/v3/bot/${token}/webhook`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://n8n.manytalks.com.br/webhook/manytalksia',
        extra: {
          id: session.user.id,
          isIntegrationUser: "false"
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Erro ao configurar webhook: ${response.statusText}`)
    }

    // Atualizar o status do webhook no banco de dados
    await prisma.$executeRaw`
      UPDATE "WhatsAppConnection"
      SET "webhookConfigured" = true, "updatedAt" = NOW()
      WHERE "id" = ${connection.id}
    `

    revalidatePath('/app/settings/whatsapp')

    return {
      data: { success: true },
      error: null,
    }
  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro ao configurar webhook',
      data: null,
    }
  }
}

// Buscar todas as conexões do usuário
export async function getWhatsAppConnections() {
  try {
    const session = await auth()
    
    // Verificar se o usuário está autenticado
    if (!session?.user?.id) {
      return {
        error: 'Usuário não autorizado',
        data: null,
      }
    }

    // Buscar as conexões do usuário
    const connections = await prisma.whatsAppConnection.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      data: connections,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao buscar conexões:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro ao buscar conexões',
      data: null,
    }
  }
}

// Atualizar o status (ativo/inativo) de uma conexão
export async function toggleWhatsAppConnection(connectionId: string, isActive: boolean) {
  try {
    const session = await auth()
    
    // Verificar se o usuário está autenticado
    if (!session?.user?.id) {
      return {
        error: 'Usuário não autorizado',
        data: null,
      }
    }

    // Buscar a conexão para verificar se pertence ao usuário
    const connections = await prisma.$queryRaw<WhatsAppConnection[]>`
      SELECT * FROM "WhatsAppConnection"
      WHERE "id" = ${connectionId}
      LIMIT 1
    `

    if (!connections || connections.length === 0 || connections[0].userId !== session.user.id) {
      return {
        error: 'Conexão não encontrada ou não pertence ao usuário',
        data: null,
      }
    }

    const connection = connections[0]

    let webhookConfigured = connection.webhookConfigured

    // Se estiver desativando a conexão, remover o webhook
    if (!isActive && connection.webhookConfigured) {
      try {
        const webhookResponse = await fetch(`http://173.249.22.227:31000/v3/bot/${connection.token}/webhook`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        })
        
        if (!webhookResponse.ok) {
          console.warn('Erro ao remover webhook na API externa, mas continuando com a desativação')
        } else {
          webhookConfigured = false
        }
      } catch (error) {
        console.error('Erro ao remover webhook:', error)
        // Continua com a desativação mesmo se falhar ao remover o webhook
      }
    }

    // Se estiver ativando a conexão e não tem webhook configurado, criar o webhook
    if (isActive && !connection.webhookConfigured) {
      try {
        const webhookResponse = await fetch(`http://173.249.22.227:31000/v3/bot/${connection.token}/webhook`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://n8n.manytalks.com.br/webhook/manytalksia',
            extra: {
              id: session.user.id,
              isIntegrationUser: "false"
            }
          })
        })
        
        if (webhookResponse.ok) {
          webhookConfigured = true
        } else {
          console.warn('Erro ao configurar webhook na API externa, mas continuando com a ativação')
        }
      } catch (error) {
        console.error('Erro ao configurar webhook:', error)
        // Continua com a ativação mesmo se falhar ao configurar o webhook
      }
    }

    // Atualizar o status da conexão
    await prisma.$executeRaw`
      UPDATE "WhatsAppConnection"
      SET "isActive" = ${isActive}, "webhookConfigured" = ${webhookConfigured}, "updatedAt" = NOW()
      WHERE "id" = ${connectionId}
    `

    const updatedConnections = await prisma.$queryRaw<WhatsAppConnection[]>`
      SELECT * FROM "WhatsAppConnection"
      WHERE "id" = ${connectionId}
      LIMIT 1
    `

    revalidatePath('/app/settings/whatsapp')

    return {
      data: updatedConnections[0],
      error: null,
    }
  } catch (error) {
    console.error('Erro ao atualizar conexão:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro ao atualizar conexão',
      data: null,
    }
  }
}

// Excluir uma conexão
export async function deleteWhatsAppConnection(connectionId: string) {
  try {
    const session = await auth()
    
    // Verificar se o usuário está autenticado
    if (!session?.user?.id) {
      return {
        error: 'Usuário não autorizado',
        data: null,
      }
    }

    // Buscar a conexão para verificar se pertence ao usuário
    const connections = await prisma.$queryRaw<WhatsAppConnection[]>`
      SELECT * FROM "WhatsAppConnection"
      WHERE "id" = ${connectionId}
      LIMIT 1
    `

    if (!connections || connections.length === 0 || connections[0].userId !== session.user.id) {
      return {
        error: 'Conexão não encontrada ou não pertence ao usuário',
        data: null,
      }
    }

    const connection = connections[0];

    // Fazer a requisição para deletar a conexão na API externa
    try {
      const response = await fetch('http://173.249.22.227:31000/info', {
        method: 'DELETE',
        headers: {
          'X-QUEPASA-TOKEN': connection.token,
        },
      });

      if (!response.ok) {
        console.error('Erro ao deletar conexão na API externa:', response.statusText);
        // Continua com a deleção no banco mesmo se falhar na API externa
      }
    } catch (error) {
      console.error('Erro ao fazer requisição para API externa:', error);
      // Continua com a deleção no banco mesmo se falhar na API externa
    }

    // Excluir a conexão do banco
    await prisma.$executeRaw`
      DELETE FROM "WhatsAppConnection"
      WHERE "id" = ${connectionId}
    `

    revalidatePath('/app/settings/whatsapp')

    return {
      data: { success: true },
      error: null,
    }
  } catch (error) {
    console.error('Erro ao excluir conexão:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro ao excluir conexão',
      data: null,
    }
  }
} 
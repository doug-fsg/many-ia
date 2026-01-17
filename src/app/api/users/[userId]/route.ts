import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const masterKey = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!masterKey) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Verificar se a MASTER_KEY fornecida corresponde à do .env
  if (masterKey !== process.env.MASTER_KEY) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Obter parâmetros de query
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');
    const inboxId = searchParams.get('inboxId');

    // Construir filtro para aiConfigs (se houver filtros)
    const aiConfigsWhere: any = {};
    if (configId) {
      aiConfigsWhere.id = configId;
    }
    if (inboxId) {
      aiConfigsWhere.inboxId = parseInt(inboxId);
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        aiConfigs: {
          where: Object.keys(aiConfigsWhere).length > 0 ? aiConfigsWhere : undefined,
          select: {
            id: true,
            userId: true,
            isActive: true,
            detectarIdioma: true,
            nomeAtendenteDigital: true,
            enviarParaAtendente: true,
            quemEhAtendente: true,
            oQueAtendenteFaz: true,
            objetivoAtendente: true,
            comoAtendenteDeve: true,
            horarioAtendimento: true,
            condicoesAtendimento: true,
            informacoesEmpresa: true,
            tempoRetornoAtendimento: true,
            createdAt: true,
            inboxId: true,
            inboxName: true,
            updatedAt: true,
            googleCalendarEnabled: true,
            attachments: {
              select: {
                id: true,
                type: true,
                content: true,
                description: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            temasEvitar: true,
          },
        },
        accounts: true,
        inboxes: true,
        sessions: true,
        whatsAppConnections: {
          select: {
            id: true,
            phoneNumber: true,
            name: true,
            isActive: true,
            webhookConfigured: true,
            createdAt: true,
            updatedAt: true,
            aiConfig: {
              select: {
                id: true,
                nomeAtendenteDigital: true,
                isActive: true
              }
            }
          }
        },
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Adicionar informações resumidas das conexões WhatsApp
    const whatsappSummary = {
      totalConnections: user.whatsAppConnections.length,
      activeConnections: user.whatsAppConnections.filter(conn => conn.isActive).length,
      connectionsWithWebhook: user.whatsAppConnections.filter(conn => conn.webhookConfigured).length,
      connectionsWithAI: user.whatsAppConnections.filter(conn => conn.aiConfig).length
    };

    return NextResponse.json({
      ...user,
      whatsappSummary
    });
  } catch (error) {
    console.error('Error retrieving user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const AI_CONFIG_MINIMAL_SELECT = {
  id: true,
  userId: true,
  isActive: true,
  nomeAtendenteDigital: true,
  inboxId: true,
  inboxName: true,
  googleCalendarEnabled: true,
  createdAt: true,
  updatedAt: true,
} as const;

const AI_CONFIG_FULL_SELECT = {
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
      description: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  temasEvitar: true,
} as const;

const VALID_INCLUDES = [
  'aiconfigs',
  'accounts',
  'inboxes',
  'sessions',
  'whatsappconnections',
];

function parseIncludeParam(value: string | null): Set<string> {
  if (!value) return new Set(['aiconfigs']);
  const filtered = value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => VALID_INCLUDES.includes(s));
  return new Set(filtered.length > 0 ? filtered : ['aiconfigs']);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const masterKey = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!masterKey) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (masterKey !== process.env.MASTER_KEY) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');
    const inboxId = searchParams.get('inboxId');
    const isActive = searchParams.get('isActive');
    const include = parseIncludeParam(searchParams.get('include'));
    const aiConfigsDetail = searchParams.get('aiConfigsDetail') ?? 'full';

    const aiConfigsWhere: Record<string, unknown> = {};
    if (configId) aiConfigsWhere.id = configId;
    if (inboxId) aiConfigsWhere.inboxId = parseInt(inboxId, 10);
    if (isActive === 'true' || isActive === 'false') {
      aiConfigsWhere.isActive = isActive === 'true';
    }

    const aiConfigsSelect =
      aiConfigsDetail === 'minimal' ? AI_CONFIG_MINIMAL_SELECT : AI_CONFIG_FULL_SELECT;

    const includeRelations: Record<string, unknown> = {};

    if (include.has('aiconfigs')) {
      includeRelations.aiConfigs = {
        where: Object.keys(aiConfigsWhere).length > 0 ? aiConfigsWhere : undefined,
        select: aiConfigsSelect,
      };
    }

    if (include.has('accounts')) {
      includeRelations.accounts = true;
    }

    if (include.has('inboxes')) {
      includeRelations.inboxes = true;
    }

    if (include.has('sessions')) {
      includeRelations.sessions = true;
    }

    if (include.has('whatsappconnections')) {
      includeRelations.whatsAppConnections = {
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
              isActive: true,
            },
          },
        },
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        companyName: true,
        stripeCustomerId: true,
        stripePriceId: true,
        stripeSubscriptionId: true,
        stripeSubscriptionStatus: true,
        manytalksAccountId: true,
        isIntegrationUser: true,
        canCreateTemplates: true,
        customCreditLimit: true,
        isSuperAdmin: true,
        ...includeRelations,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    let response: Record<string, unknown> = { ...user };

    if (include.has('whatsappconnections') && user.whatsAppConnections) {
      const connections = user.whatsAppConnections as Array<{
        isActive: boolean;
        webhookConfigured: boolean;
        aiConfig: unknown;
      }>;
      response.whatsappSummary = {
        totalConnections: connections.length,
        activeConnections: connections.filter((c) => c.isActive).length,
        connectionsWithWebhook: connections.filter((c) => c.webhookConfigured).length,
        connectionsWithAI: connections.filter((c) => c.aiConfig).length,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving filtered user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

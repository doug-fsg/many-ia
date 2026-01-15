import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setFeatureFlag, getAllFeatureFlags } from '@/lib/feature-flags';
import { isValidFeatureName } from '@/config/features';

/**
 * GET /api/super_admin/clients/[clientId]/feature-flags
 * Retorna todos os Feature Flags de um cliente específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    // Verificar autenticação do super admin via sessionStorage (frontend)
    // A verificação real será feita no middleware ou componente
    const flags = await getAllFeatureFlags(params.clientId);

    return NextResponse.json({
      success: true,
      flags,
    });
  } catch (error) {
    console.error('[API] Erro ao buscar Feature Flags do cliente:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao buscar Feature Flags',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/super_admin/clients/[clientId]/feature-flags
 * Atualiza um Feature Flag específico de um cliente
 * Body: { featureName: string, enabled: boolean }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { featureName, enabled } = await request.json();

    if (!featureName || typeof enabled !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          message: 'featureName e enabled são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Validar nome da feature (opcional, mas recomendado)
    if (!isValidFeatureName(featureName)) {
      console.warn(`[FEATURE-FLAGS] Feature name não reconhecido: ${featureName}`);
      // Continuar mesmo assim para permitir flexibilidade
    }

    // Verificar se o cliente existe
    const client = await prisma.user.findUnique({
      where: { id: params.clientId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cliente não encontrado',
        },
        { status: 404 }
      );
    }

    // Atualizar o Feature Flag
    await setFeatureFlag(params.clientId, featureName, enabled);

    // Retornar flags atualizados
    const updatedFlags = await getAllFeatureFlags(params.clientId);

    return NextResponse.json({
      success: true,
      message: `Feature Flag ${featureName} ${enabled ? 'ativado' : 'desativado'} com sucesso`,
      flags: updatedFlags,
    });
  } catch (error) {
    console.error('[API] Erro ao atualizar Feature Flag:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao atualizar Feature Flag',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}


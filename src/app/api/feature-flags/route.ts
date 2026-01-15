import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { getAllFeatureFlags } from '@/lib/feature-flags';

/**
 * GET /api/feature-flags
 * Retorna todos os Feature Flags do usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      );
    }

    const flags = await getAllFeatureFlags(session.user.id);

    return NextResponse.json({
      success: true,
      flags,
    });
  } catch (error) {
    console.error('[API] Erro ao buscar Feature Flags:', error);
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


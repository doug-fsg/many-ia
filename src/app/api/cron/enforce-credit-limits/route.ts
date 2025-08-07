import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { checkAndEnforceCreditLimit } from '@/lib/subscription-helper'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação usando o mesmo padrão das outras APIs
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }

    try {
      const decoded = verifyToken(token);
      console.log(`[CRON] Usuário autenticado: ${decoded.email} (${decoded.userId})`);
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    console.log('[CRON] Iniciando verificação de limites de créditos para todos os usuários')

    // Buscar todos os usuários que têm configurações ativas
    const usersWithActiveConfigs = await prisma.user.findMany({
      where: {
        aiConfigs: {
          some: {
            isActive: true
          }
        }
      },
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            aiConfigs: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    })

    console.log(`[CRON] Encontrados ${usersWithActiveConfigs.length} usuários com configurações ativas`)

    let totalDeactivated = 0
    let usersProcessed = 0

    // Verificar cada usuário
    for (const user of usersWithActiveConfigs) {
      try {
        const result = await checkAndEnforceCreditLimit(user.id)
        
        if (result.isOutOfCredits) {
          totalDeactivated += result.deactivatedCount
          console.log(`[CRON] Usuário ${user.email}: ${result.deactivatedCount} configurações desativadas`)
        }
        
        usersProcessed++
      } catch (error) {
        console.error(`[CRON] Erro ao verificar usuário ${user.email}:`, error)
      }
    }

    console.log(`[CRON] Processamento concluído: ${usersProcessed} usuários verificados, ${totalDeactivated} configurações desativadas`)

    return NextResponse.json({
      success: true,
      usersProcessed,
      totalDeactivated,
      message: `Verificação concluída: ${totalDeactivated} configurações desativadas por excesso de créditos`
    })

  } catch (error) {
    console.error('[CRON] Erro na verificação de limites de créditos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  }
} 
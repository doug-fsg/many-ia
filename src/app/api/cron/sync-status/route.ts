import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Endpoint para verificar o status da última sincronização
export async function GET(req: NextRequest) {
  try {
    // Verificar chave de autenticação para APIs cron (opcional, mas recomendado)
    const authHeader = req.headers.get('authorization')
    
    // Se você tiver uma chave de autenticação configurada no .env
    // Descomente o código abaixo
    /*
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    */

    // Obter a data da última sincronização bem-sucedida
    // (essa informação poderia ser armazenada em um registro no banco de dados)
    const lastSyncRecords = await prisma.$queryRaw`
      SELECT 
        "updatedAt" 
      FROM "Referral"
      WHERE status = 'active'
      ORDER BY "updatedAt" DESC
      LIMIT 1
    ` as Array<{ updatedAt: Date }>

    const lastSyncDate = lastSyncRecords.length > 0 
      ? lastSyncRecords[0].updatedAt 
      : null

    // Obter contagem de referências por status
    const referralCountsByStatus = await prisma.$queryRaw`
      SELECT 
        status, 
        COUNT(*) as count
      FROM "Referral"
      GROUP BY status
    ` as Array<{ status: string, count: number }>

    // Obter contagem de afiliados ativos
    const activeAffiliates = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Affiliate"
      WHERE status = 'active'
      AND "stripeConnectAccountId" IS NOT NULL
    ` as Array<{ count: number }>

    return NextResponse.json({
      lastSyncDate,
      referralsByStatus: referralCountsByStatus,
      activeAffiliatesCount: activeAffiliates[0]?.count || 0,
      systemTime: new Date()
    })
  } catch (error: any) {
    console.error('Erro ao verificar status da sincronização:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar status da sincronização' },
      { status: 500 }
    )
  }
} 
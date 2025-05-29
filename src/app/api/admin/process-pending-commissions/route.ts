import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'
import { processPendingPayments } from '@/lib/affiliate-payments'
import { getToken } from 'next-auth/jwt'

// Processa comissões pendentes para um afiliado específico
export async function POST(req: NextRequest) {
  // Verificar se o usuário está autenticado via sessão
  const session = await auth()
  
  // Se não houver sessão, tentar verificar via token de autenticação no cabeçalho
  let userId = session?.user?.id
  
  if (!userId) {
    // Verificar se temos um token de autenticação no cabeçalho
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        // Verificar se o usuário existe com base no ID fornecido no corpo
        const body = await req.json()
        if (body.userId) {
          // Verificar se o token da sessão corresponde ao que está armazenado
          const userExists = await prisma.user.findUnique({
            where: { id: body.userId },
            select: { id: true }
          })
          
          if (userExists) {
            userId = body.userId
          }
        }
      } catch (error) {
        console.error('Erro ao processar token:', error)
      }
    }
  }
  
  // Se ainda não temos userId, retornar não autorizado
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Verificar se o usuário é um afiliado
  const affiliate = await prisma.$queryRaw`
    SELECT * FROM "Affiliate" WHERE "userId" = ${userId}
  ` as Array<{ id: string; status: string }>

  if (!affiliate || affiliate.length === 0) {
    return NextResponse.json({ error: 'Usuário não é um afiliado' }, { status: 403 })
  }

  try {
    // Tornar o corpo da requisição opcional
    let affiliateId;
    try {
      const body = await req.json().catch(() => ({}))
      affiliateId = body.affiliateId;
    } catch {
      // Se não houver corpo na requisição, affiliateId será undefined
      affiliateId = undefined;
    }
    
    // Se affiliateId não for fornecido, usar o ID do afiliado do usuário autenticado
    const targetAffiliateId = affiliateId || affiliate[0].id
    
    // Verificar se é o próprio afiliado ou um admin (implementar lógica de admin se necessário)
    if (targetAffiliateId !== affiliate[0].id) {
      return NextResponse.json({ error: 'Não autorizado a processar comissões de outros afiliados' }, { status: 403 })
    }

    // Processar pagamentos pendentes usando o utilitário compartilhado
    const results = await processPendingPayments(targetAffiliateId)

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
  } catch (error: any) {
    console.error('Erro ao processar comissões pendentes:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  }
} 
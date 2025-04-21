import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/services/database'

// IMPORTANTE: Esta rota só deve ser usada em ambiente de desenvolvimento para depuração
export async function GET() {
  // Verificar ambiente
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Esta rota não está disponível em produção' },
      { status: 403 }
    )
  }

  try {
    console.log('[DEBUG-RESET] Iniciando limpeza de sessões e cookies')
    
    // Limpar sessões no banco de dados
    const deletedSessions = await prisma.session.deleteMany({})
    console.log(`[DEBUG-RESET] ${deletedSessions.count} sessões removidas do banco de dados`)
    
    // Listar todos os cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    
    // Cookies relacionados à autenticação que devem ser removidos
    const authCookies = [
      'authjs.session-token',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ]
    
    // Remover cookies de autenticação
    let cookiesRemoved = 0
    for (const cookieName of authCookies) {
      if (cookieStore.get(cookieName)) {
        cookieStore.delete(cookieName)
        cookiesRemoved++
      }
    }
    
    console.log(`[DEBUG-RESET] ${cookiesRemoved} cookies de autenticação removidos`)
    
    return NextResponse.json({
      success: true,
      message: 'Sessões e cookies limpos com sucesso',
      details: {
        sessionsRemoved: deletedSessions.count,
        cookiesRemoved,
        remainingCookies: allCookies.filter(c => !authCookies.includes(c.name)).map(c => c.name)
      }
    })
  } catch (error) {
    console.error('[DEBUG-RESET] Erro ao limpar sessões e cookies:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar a solicitação',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 
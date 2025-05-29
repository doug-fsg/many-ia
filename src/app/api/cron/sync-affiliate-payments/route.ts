import { NextRequest, NextResponse } from 'next/server'
import { processAllPendingPayments } from '@/lib/affiliate-payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Handler para chamadas cron
export async function GET(req: NextRequest) {
  // Verificar chave de autenticação para APIs cron (opcional, mas recomendado)
  const authHeader = req.headers.get('authorization')
  
  // Se você tiver uma chave de autenticação configurada no .env
  // Descomente o código abaixo
  /*
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  */
  
  try {
    // Processar todos os pagamentos pendentes usando o utilitário compartilhado
    const result = await processAllPendingPayments()
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Erro na sincronização de pagamentos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar a sincronização' },
      { status: 500 }
    )
  }
} 
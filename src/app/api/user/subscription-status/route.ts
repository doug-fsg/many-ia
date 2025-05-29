import { NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { checkUserSubscription } from '@/lib/subscription-helper'

export async function GET() {
  try {
    // Obter a sessão do usuário atual
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    
    // Verificar o status da assinatura
    const subscriptionStatus = await checkUserSubscription(session.user.id)
    
    return NextResponse.json(subscriptionStatus)
  } catch (error) {
    console.error('Erro ao verificar status da assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status da assinatura' },
      { status: 500 }
    )
  }
} 
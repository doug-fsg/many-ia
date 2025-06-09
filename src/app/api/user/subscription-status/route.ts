import { auth } from '@/services/auth'
import { checkUserSubscription } from '@/lib/subscription-helper'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

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
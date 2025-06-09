import { NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { stripe } from '@/services/stripe'
import { auth } from '@/services/auth'

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar afiliado
    const affiliate = await prisma.affiliate.findFirst({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Afiliado não encontrado' },
        { status: 404 }
      )
    }

    if (!affiliate.stripeConnectAccountId) {
      return NextResponse.json(
        { error: 'Conta Stripe não encontrada' },
        { status: 400 }
      )
    }

    // Criar novo link de onboarding
    const accountLink = await stripe.accountLinks.create({
      account: affiliate.stripeConnectAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate-program/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate-program/onboarding/success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      accountLink: accountLink.url,
    })
  } catch (error) {
    console.error('Erro ao atualizar link de onboarding:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
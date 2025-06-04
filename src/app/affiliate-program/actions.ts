'use server'

import { auth } from '@/services/auth'
import { stripe } from '@/services/stripe'
import { prisma } from '@/services/database'
import { nanoid } from 'nanoid'

export async function createAffiliateAccount() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Usuário não autenticado')
  }

  try {
    // Verificar se já é afiliado
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id }
    })

    if (existingAffiliate) {
      throw new Error('Você já é um afiliado')
    }

    // Criar conta Stripe Connect
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email: session.user.email!,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    })

    // Gerar código de referência único
    const referralCode = nanoid(10)

    // Criar registro de afiliado
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: session.user.id,
        stripeConnectAccountId: account.id,
        referralCode,
        status: 'pending'
      }
    })

    // Gerar link do Stripe Connect
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate-program?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate-program?success=true`,
      type: 'account_onboarding',
    })

    return {
      success: true,
      accountLink: accountLink.url
    }
  } catch (error) {
    console.error('Erro ao criar conta de afiliado:', error)
    throw error
  }
} 
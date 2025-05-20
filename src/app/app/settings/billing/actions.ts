'use server'

import { auth } from '@/services/auth'
import { stripe } from '@/services/stripe'
import { redirect } from 'next/navigation'
import { prisma } from '@/services/database'

export async function createCustomerPortalAction(formData: FormData) {
  const session = await auth()

  console.log('Session:', {
    userId: session?.user?.id,
    isIntegrationUser: session?.user?.isIntegrationUser,
    stripeCustomerId: session?.user?.stripeCustomerId,
    email: session?.user?.email
  })

  if (!session?.user?.id) {
    throw new Error('Usuário não autenticado')
  }

  if (session.user.isIntegrationUser) {
    throw new Error('Usuário de integração não tem acesso ao portal')
  }

  // Se não tiver stripeCustomerId, buscar no banco de dados
  if (!session.user.stripeCustomerId) {
    try {
      // Buscar o usuário no banco de dados para obter o stripeCustomerId
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true }
      })

      if (user?.stripeCustomerId) {
        session.user.stripeCustomerId = user.stripeCustomerId
        console.log('ID do cliente encontrado no banco:', user.stripeCustomerId)
      } else {
        throw new Error('Usuário não possui um ID de cliente no Stripe')
      }
    } catch (error) {
      console.error('Erro ao buscar ID do cliente:', error)
      throw new Error('Erro ao acessar informações do cliente')
    }
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: session.user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing`,
    })

    if (!portalSession.url) {
      throw new Error('Não foi possível criar a sessão do portal')
    }

    console.log('Redirecionando para:', portalSession.url)
    redirect(portalSession.url)
  } catch (error) {
    // Verificar se o erro é do tipo NEXT_REDIRECT
    if (error && (error as any).digest?.startsWith('NEXT_REDIRECT')) {
      // Este é um redirecionamento normal, não um erro
      throw error;
    }
    
    console.error('Erro ao criar sessão do portal:', error)
    throw new Error('Erro ao acessar o portal de pagamento')
  }
}

export async function reactivateSubscriptionAction() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Usuário não autenticado')
  }

  if (session.user.isIntegrationUser) {
    throw new Error('Usuário de integração não tem acesso ao portal')
  }

  try {
    // Buscar o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripeSubscriptionStatus: true 
      }
    })

    if (!user?.stripeCustomerId) {
      throw new Error('Usuário não possui um ID de cliente no Stripe')
    }

    if (!user?.stripeSubscriptionId) {
      throw new Error('Usuário não possui uma assinatura')
    }

    if (user?.stripeSubscriptionStatus !== 'canceled') {
      throw new Error('A assinatura não está cancelada')
    }

    // Verificar se há faturas pendentes
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      status: 'open',
      limit: 1
    })

    if (invoices.data.length > 0) {
      throw new Error('Existem faturas pendentes. Por favor, pague todas as faturas antes de reativar a assinatura.')
    }

    // Criar uma nova assinatura
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    // Atualizar o usuário no banco de dados
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
      }
    })

    // Redirecionar para o portal de pagamento para configurar o método de pagamento
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing`,
    })

    redirect(portalSession.url)
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error)
    throw error
  }
}

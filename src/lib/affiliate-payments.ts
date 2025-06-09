import { Prisma } from '@prisma/client'
import { prisma } from '@/services/database'
import { stripe } from '@/services/stripe'
import type { Stripe } from 'stripe'

// Tipos para as entidades relacionadas ao sistema de afiliados
export type AffiliateWithAccount = {
  id: string
  stripeConnectAccountId: string | null
  commissionRate?: number
}

export type ReferralWithUser = {
  id: string
  status: string
  referredUser: {
    stripeSubscriptionId: string | null
    stripeSubscriptionStatus: string | null
  }
}

type ReferralWithAffiliate = {
  id: string
  affiliate: {
    id: string
    stripeConnectAccountId: string | null
    commissionRate?: number
  }
}

// Função para processar pagamento para um afiliado específico
export async function processAffiliatePayment(
  referral: ReferralWithAffiliate,
  paidInvoice: Stripe.Invoice,
  customer: Stripe.Customer | Stripe.DeletedCustomer,
  subscription: Stripe.Subscription
) {
  try {
    // Verificar se o afiliado tem uma conta Stripe Connect
    if (!referral.affiliate.stripeConnectAccountId) {
      console.log(`Afiliado ${referral.affiliate.id} não tem conta Stripe Connect. Marcando referência como pendente.`)
      await prisma.$executeRaw`
        UPDATE "Referral" 
        SET status = 'pending_payment', "updatedAt" = NOW() 
        WHERE id = ${referral.id}
      `
      return {
        success: false,
        status: 'pending_payment',
        message: 'Afiliado sem conta Stripe Connect'
      }
    }

    // Verificar se a assinatura tem transfer_data configurado
    if (!subscription.transfer_data?.destination) {
      // Se não tiver, configurar o transfer_data com a comissão correta
      const commissionRate = referral.affiliate.commissionRate || 50;
      
      await stripe.subscriptions.update(subscription.id, {
        transfer_data: {
          destination: referral.affiliate.stripeConnectAccountId,
          amount_percent: commissionRate // Porcentagem que vai para o afiliado
        }
      });

      console.log(`Configurada comissão de ${commissionRate}% para o afiliado ${referral.affiliate.id}`);
    }

    // Atualizar status do referral
    await prisma.$executeRaw`
      UPDATE "Referral" 
      SET status = 'active', "updatedAt" = NOW() 
      WHERE id = ${referral.id}
    `

    console.log(`Referral ${referral.id} atualizado para status active`)
    return {
      success: true,
      status: 'processed',
      message: 'Referral atualizado com sucesso'
    }
  } catch (error: any) {
    console.error('Erro ao processar pagamento para afiliado:', error)
    return {
      success: false,
      status: 'error',
      message: error.message || 'Erro ao processar pagamento'
    }
  }
}

// Função para processar pagamentos pendentes para um afiliado
export async function processPendingPayments(affiliateId: string) {
  try {
    // Buscar referências pendentes de pagamento com a taxa de comissão
    const pendingReferrals = await prisma.$queryRaw`
      SELECT 
        r.id, 
        r.status,
        u."stripeCustomerId",
        u."stripeSubscriptionId",
        u."stripeSubscriptionStatus",
        u.email,
        a.id as "affiliateId",
        a."stripeConnectAccountId",
        a."commissionRate"
      FROM "Referral" r
      JOIN "User" u ON r."referredUserId" = u.id
      JOIN "Affiliate" a ON r."affiliateId" = a.id
      WHERE r."affiliateId" = ${affiliateId}
      AND (r.status = 'pending' OR r.status = 'pending_payment')
    ` as Array<{
      id: string
      status: string
      stripeCustomerId: string | null
      stripeSubscriptionId: string | null
      stripeSubscriptionStatus: string | null
      email: string | null
      affiliateId: string
      stripeConnectAccountId: string | null
      commissionRate: number
    }>

    console.log(`Encontradas ${pendingReferrals.length} referências pendentes para o afiliado ${affiliateId}`)

    const results = []
    // Processar cada referência pendente
    for (const referral of pendingReferrals) {
      // Verificar se o usuário referido tem uma assinatura ativa
      if (
        referral.stripeSubscriptionStatus !== 'active' ||
        !referral.stripeSubscriptionId ||
        !referral.stripeCustomerId ||
        !referral.stripeConnectAccountId
      ) {
        results.push({
          referralId: referral.id,
          status: 'ineligible',
          message: 'Usuário não tem assinatura ativa ou conta de afiliado incompleta'
        })
        continue
      }

      try {
        // Buscar a assinatura atual
        const subscription = await stripe.subscriptions.retrieve(
          referral.stripeSubscriptionId
        )

        // Buscar a fatura mais recente
        const invoices = await stripe.invoices.list({
          customer: referral.stripeCustomerId,
          subscription: referral.stripeSubscriptionId,
          limit: 1
        })

        if (invoices.data.length === 0 || invoices.data[0].status !== 'paid') {
          results.push({
            referralId: referral.id,
            status: 'pending',
            message: 'Nenhuma fatura paga encontrada'
          })
          continue
        }

        const latestInvoice = invoices.data[0]
        const customer = await stripe.customers.retrieve(
          referral.stripeCustomerId
        )

        // Processar o pagamento incluindo a taxa de comissão personalizada
        const paymentResult = await processAffiliatePayment(
          {
            id: referral.id,
            affiliate: {
              id: affiliateId,
              stripeConnectAccountId: referral.stripeConnectAccountId,
              commissionRate: referral.commissionRate
            }
          },
          latestInvoice,
          customer,
          subscription
        )

        results.push({
          referralId: referral.id,
          ...paymentResult
        })
      } catch (error: any) {
        console.error(`Erro ao processar referência ${referral.id}:`, error)
        results.push({
          referralId: referral.id,
          status: 'error',
          message: error.message || 'Erro desconhecido'
        })
      }
    }

    return results
  } catch (error: any) {
    console.error('Erro ao processar pagamentos pendentes:', error)
    throw error
  }
}

// Função para processar todos os pagamentos pendentes
export async function processAllPendingPayments() {
  try {
    // Buscar todos os afiliados ativos com contas Stripe Connect
    const affiliates = await prisma.$queryRaw`
      SELECT id, "stripeConnectAccountId"
      FROM "Affiliate"
      WHERE status = 'active'
      AND "stripeConnectAccountId" IS NOT NULL
    ` as Array<{
      id: string
      stripeConnectAccountId: string
    }>

    const results = []
    for (const affiliate of affiliates) {
      try {
        const affiliateResults = await processPendingPayments(affiliate.id)
        results.push({
          affiliateId: affiliate.id,
          results: affiliateResults
        })
      } catch (error: any) {
        results.push({
          affiliateId: affiliate.id,
          error: error.message || 'Erro ao processar pagamentos'
        })
      }
    }

    return results
  } catch (error: any) {
    console.error('Erro ao processar todos os pagamentos pendentes:', error)
    throw error
  }
} 
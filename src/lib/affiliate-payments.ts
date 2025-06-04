import { Prisma } from '@prisma/client'
import { prisma } from '@/services/database'
import { stripe } from '@/services/stripe'
import Stripe from 'stripe'

// Tipos para as entidades relacionadas ao sistema de afiliados
export type AffiliateWithAccount = {
  id: string
  stripeConnectAccountId: string | null
  commissionRate?: number // Adicionando o campo de taxa de comissão
}

// Tipo para referência com dados do afiliado
export type ReferralWithAffiliate = {
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

    // Obter a taxa de comissão (usando 50% como padrão se não estiver disponível)
    const commissionRate = referral.affiliate.commissionRate || 50;
    
    // Calcular valor da comissão
    const commissionPercentage = commissionRate / 100;
    const amount = Math.round(paidInvoice.amount_paid * commissionPercentage);
    
    if (amount <= 0) {
      console.log(`Valor da comissão inválido: ${amount}. Nenhum pagamento processado.`)
      return {
        success: false,
        status: 'error',
        message: 'Valor da comissão inválido'
      }
    }

    // Obter o charge.id da fatura para usar como source_transaction
    let sourceTransaction: string | null = null;
    
    if (paidInvoice.charge && typeof paidInvoice.charge === 'string') {
      // Se a fatura já tem o ID da cobrança
      sourceTransaction = paidInvoice.charge;
    } else {
      // Buscar charges associadas à fatura
      const charges = await stripe.charges.list({
        customer: paidInvoice.customer as string,
        limit: 1
      });
      
      if (charges.data.length > 0) {
        sourceTransaction = charges.data[0].id;
      }
    }
    
    if (!sourceTransaction) {
      return {
        success: false,
        status: 'error',
        message: 'Nenhuma cobrança (charge) encontrada para esta transação'
      };
    }
    
    console.log(`Processando transferência para afiliado. Source transaction: ${sourceTransaction}`);
    
    try {
      // Criar transferência para o afiliado com source_transaction
      await stripe.transfers.create({
        amount,
        currency: paidInvoice.currency,
        destination: referral.affiliate.stripeConnectAccountId,
        source_transaction: sourceTransaction,
        transfer_group: `sub_${subscription.id}`,
        description: `Comissão de afiliado - ${(customer as any).email || 'Cliente'}`
      });
    } catch (transferError: any) {
      // Se o erro for duplicidade (já foi processado anteriormente)
      if (transferError.code === 'duplicate_transaction') {
        // Atualizar status do referral mesmo assim
        await prisma.$executeRaw`
          UPDATE "Referral" 
          SET status = 'active', "updatedAt" = NOW() 
          WHERE id = ${referral.id}
        `
        
        return {
          success: true,
          status: 'already_processed',
          message: 'Pagamento já havia sido processado anteriormente'
        }
      }
      
      throw transferError;
    }

    // Atualizar status do referral
    await prisma.$executeRaw`
      UPDATE "Referral" 
      SET status = 'active', "updatedAt" = NOW() 
      WHERE id = ${referral.id}
    `

    console.log(`Pagamento processado para afiliado ${referral.affiliate.id}. Valor: ${amount} ${paidInvoice.currency}`)
    return {
      success: true,
      status: 'processed',
      message: `Pagamento processado. Valor: ${amount} ${paidInvoice.currency}`
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
          status: paymentResult.status,
          message: paymentResult.message
        })
      } catch (error: any) {
        results.push({
          referralId: referral.id,
          status: 'error',
          message: error.message || 'Erro ao processar pagamento'
        })
      }
    }

    return results
  } catch (error: any) {
    console.error('Erro ao processar pagamentos pendentes:', error)
    throw error
  }
}

// Função para processar pagamentos pendentes para todos os afiliados
export async function processAllPendingPayments() {
  try {
    // Buscar todos os afiliados ativos com contas Stripe Connect
    const activeAffiliates = await prisma.$queryRaw`
      SELECT id, "stripeConnectAccountId" 
      FROM "Affiliate" 
      WHERE status = 'active' 
      AND "stripeConnectAccountId" IS NOT NULL
    ` as Array<{
      id: string
      stripeConnectAccountId: string
    }>

    console.log(`Encontrados ${activeAffiliates.length} afiliados ativos para sincronização`)

    const results: any[] = []

    // Para cada afiliado, processar suas referências pendentes
    for (const affiliate of activeAffiliates) {
      const affiliateResults = await processPendingPayments(affiliate.id)
      
      results.push({
        affiliateId: affiliate.id,
        processed: affiliateResults.length,
        results: affiliateResults
      })
    }

    return {
      success: true,
      affiliatesProcessed: results.length,
      details: results
    }
  } catch (error: any) {
    console.error('Erro ao sincronizar pagamentos de afiliados:', error)
    throw error
  }
} 
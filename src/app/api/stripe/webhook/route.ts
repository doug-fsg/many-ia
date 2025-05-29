import Stripe from 'stripe'
import nodemailer from 'nodemailer'
import {
  handleProcessWebhookUpdatedSubscription,
  stripe,
} from '@/services/stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/services/database'
import { isSubscriptionBlocked, deactivateUserAIConfigs } from '@/lib/subscription-helper'
import { Prisma } from '@prisma/client'
import { processAffiliatePayment, processPendingPayments } from '@/lib/affiliate-payments'

// Configurar o transporte de email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'suporteinovechat@gmail.com',
    pass: 'dsknphgnlbgskvso',
  },
})

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    )
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Webhook Error: ${error.message}`)
      return new Response(`Webhook Error: ${error.message}`, { status: 400 })
    }
    return new Response('Webhook Error: Unknown error occurred', { status: 400 })
  }

  try {
    console.log('Processando evento do Stripe:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        if (checkoutSession.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            checkoutSession.subscription as string,
          )
          console.log('Checkout concluído:', subscription.status)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        console.log('Processing subscription event:', event.type)
        await handleProcessWebhookUpdatedSubscription(event.data)
        
        const subscription = event.data.object as Stripe.Subscription
        if (isSubscriptionBlocked(subscription.status)) {
          console.log(`Assinatura ${subscription.id} está bloqueada (${subscription.status}), desativando AIs`)
          
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { stripeSubscriptionId: subscription.id },
                { stripeCustomerId: subscription.customer as string }
              ]
            },
            select: { id: true }
          })
          
          if (user) {
            const result = await deactivateUserAIConfigs(user.id)
            console.log(`Resultado da desativação para usuário ${user.id}:`, result)
          }
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const affiliate = await prisma.$queryRaw`
          SELECT * FROM "Affiliate" WHERE "stripeConnectAccountId" = ${account.id}
        ` as Array<{ id: string; userId: string }>

        if (affiliate && affiliate.length > 0) {
          // Atualizar status do afiliado
          const newStatus = account.charges_enabled ? 'active' : 'pending'
          await prisma.$executeRaw`
            UPDATE "Affiliate" 
            SET status = ${newStatus}, "updatedAt" = NOW() 
            WHERE id = ${affiliate[0].id}
          `
          
          // Se a conta foi ativada, processar pagamentos pendentes
          if (account.charges_enabled) {
            console.log(`Conta do afiliado ${affiliate[0].id} ativada. Processando pagamentos pendentes.`)
            await processPendingPayments(affiliate[0].id)
          }
        }
        break
      }

      case 'invoice.paid': {
        const paidInvoice = event.data.object as Stripe.Invoice
        if (paidInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(paidInvoice.subscription as string)
          const customer = await stripe.customers.retrieve(paidInvoice.customer as string)
          
          // Buscar usuário e sua referência
          const userWithReferral = await prisma.$queryRaw`
            SELECT 
              u.id as "userId", 
              r.id as "referralId", 
              a.id as "affiliateId", 
              a."stripeConnectAccountId"
            FROM "User" u
            LEFT JOIN "Referral" r ON r."referredUserId" = u.id
            LEFT JOIN "Affiliate" a ON r."affiliateId" = a.id
            WHERE u."stripeCustomerId" = ${paidInvoice.customer}
            LIMIT 1
          ` as Array<{
            userId: string
            referralId: string | null
            affiliateId: string | null
            stripeConnectAccountId: string | null
          }>

          // Verificar se o usuário foi referenciado por um afiliado
          if (userWithReferral && userWithReferral.length > 0 && userWithReferral[0].referralId) {
            const referralData = userWithReferral[0]
            
            // Processar pagamento para o afiliado
            if (referralData.affiliateId && referralData.referralId) {
              await processAffiliatePayment(
                {
                  id: referralData.referralId,
                  affiliate: {
                    id: referralData.affiliateId,
                    stripeConnectAccountId: referralData.stripeConnectAccountId
                  }
                },
                paidInvoice,
                customer,
                subscription
              )
            }
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object as Stripe.Invoice
        if (failedInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription as string)
          
          if (isSubscriptionBlocked(subscription.status)) {
            console.log(`Falha no pagamento para assinatura ${subscription.id}, desativando AIs`)
            
            const user = await prisma.user.findFirst({
              where: {
                OR: [
                  { stripeSubscriptionId: subscription.id },
                  { stripeCustomerId: subscription.customer as string }
                ]
              },
              select: { id: true }
            })
            
            if (user) {
              const result = await deactivateUserAIConfigs(user.id)
              console.log(`Resultado da desativação para usuário ${user.id}:`, result)
            }
          }
        }
        break
      }

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return new Response('Webhook received successfully', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Webhook processing error', { status: 500 })
  }
}
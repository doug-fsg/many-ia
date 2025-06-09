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
import { PrismaAdapter } from '@auth/prisma-adapter'

// Configurar o transporte de email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Inicializar o adaptador do NextAuth
const adapter = PrismaAdapter(prisma)

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

          // Criar usuário sem senha
          const customerEmail = checkoutSession.customer_details?.email
          if (customerEmail) {
            try {
              // Verificar se o usuário já existe
              const existingUser = await prisma.user.findUnique({
                where: { email: customerEmail }
              })

              let userId: string;

              if (!existingUser) {
                console.log('[WEBHOOK] Criando usuário sem senha:', customerEmail)
                
                // Usar o adaptador do NextAuth para criar o usuário
                const user = await adapter.createUser?.({
                  email: customerEmail,
                  name: checkoutSession.customer_details?.name || null,
                  emailVerified: null,
                  image: null,
                  id: ''
                })

                if (!user) {
                  throw new Error('Falha ao criar usuário')
                }

                userId = user.id;

                // Atualizar informações do Stripe
                await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    stripeCustomerId: checkoutSession.customer as string,
                    stripeSubscriptionId: checkoutSession.subscription as string,
                    stripeSubscriptionStatus: subscription.status,
                    stripePriceId: process.env.STRIPE_PRICE_ID,
                  }
                })

                console.log('[WEBHOOK] Usuário criado com sucesso')
              } else {
                console.log('[WEBHOOK] Usuário já existe, atualizando informações:', customerEmail)
                userId = existingUser.id;
                await prisma.user.update({
                  where: { email: customerEmail },
                  data: {
                    stripeCustomerId: checkoutSession.customer as string,
                    stripeSubscriptionId: checkoutSession.subscription as string,
                    stripeSubscriptionStatus: subscription.status,
                    stripePriceId: process.env.STRIPE_PRICE_ID,
                  }
                })
                console.log('[WEBHOOK] Usuário atualizado com sucesso')
              }

              // Verificar se existe código de afiliado nos metadados da sessão
              const affiliateRef = subscription.metadata?.affiliate_ref
              if (affiliateRef) {
                console.log('[WEBHOOK] Código de afiliado encontrado:', affiliateRef)
                
                // Buscar o afiliado
                const affiliate = await prisma.affiliate.findFirst({
                  where: { referralCode: affiliateRef }
                })

                if (affiliate) {
                  console.log('[WEBHOOK] Criando referência para afiliado:', affiliate.id)
                  
                  // Criar a referência
                  await prisma.referral.create({
                    data: {
                      affiliateId: affiliate.id,
                      referredUserId: userId,
                      status: 'pending'
                    }
                  })

                  console.log('[WEBHOOK] Referência criada com sucesso')
                }
              }
            } catch (error) {
              console.error('[WEBHOOK] Erro ao criar/atualizar usuário:', error)
              throw error
            }
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        console.log('Processing subscription event:', event.type)
        try {
          const subscription = event.data.object as Stripe.Subscription;
          await handleProcessWebhookUpdatedSubscription(event.data)
          
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
        } catch (error) {
          const subscription = event.data.object as Stripe.Subscription;
          console.error(`Webhook error no evento ${event.type}:`, error)
          console.error('Stack trace:', error instanceof Error ? error.stack : '')
          console.error('Objeto relacionado ao erro - ID:', subscription.id, 'Tipo:', event.type)
          // Não relançar o erro para evitar reenvio do webhook
          return new Response('Webhook processed with non-critical error', { status: 200 })
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
        console.log('[WEBHOOK] Processando invoice.paid:', paidInvoice.id)
        
        if (paidInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(paidInvoice.subscription as string)
          const customer = await stripe.customers.retrieve(paidInvoice.customer as string)
          
          console.log('[WEBHOOK] Buscando referência para customer:', paidInvoice.customer)
          
          // Buscar usuário e sua referência com a taxa de comissão
          const userWithReferral = await prisma.$queryRaw`
            SELECT 
              u.id as "userId", 
              r.id as "referralId", 
              a.id as "affiliateId", 
              a."stripeConnectAccountId",
              a."commissionRate"
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
            commissionRate: number | null
          }>

          console.log('[WEBHOOK] Resultado da busca de referência:', userWithReferral)

          // Verificar se o usuário foi referenciado por um afiliado
          if (userWithReferral && userWithReferral.length > 0 && userWithReferral[0].referralId) {
            const referralData = userWithReferral[0]
            console.log('[WEBHOOK] Encontrada referência válida:', referralData)
            
            // Processar pagamento para o afiliado
            if (referralData.affiliateId && referralData.referralId) {
              console.log('[WEBHOOK] Iniciando processamento do pagamento para afiliado:', referralData.affiliateId)
              const result = await processAffiliatePayment(
                {
                  id: referralData.referralId,
                  affiliate: {
                    id: referralData.affiliateId,
                    stripeConnectAccountId: referralData.stripeConnectAccountId,
                    commissionRate: referralData.commissionRate || 50
                  }
                },
                paidInvoice,
                customer,
                subscription
              )
              console.log('[WEBHOOK] Resultado do processamento:', result)
            }
          } else {
            console.log('[WEBHOOK] Nenhuma referência encontrada para o customer:', paidInvoice.customer)
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

      // Eventos relacionados a contas Connect
      case 'person.created':
      case 'person.updated':
      case 'capability.updated': {
        // Apenas logamos esses eventos, não precisamos realizar ações específicas
        console.log(`Evento Connect processado: ${event.type}`)
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
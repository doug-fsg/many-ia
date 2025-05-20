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
      return new Response(`Webhook Error: ${error.message}`, {
        status: 400,
      })
    }
    console.error('Webhook Error: Unknown error occurred')
    return new Response('Webhook Error: Unknown error occurred', {
      status: 400,
    })
  }

  try {
    console.log('Processando evento do Stripe:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        // Lógica para quando uma sessão de checkout é concluída
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        if (checkoutSession.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            checkoutSession.subscription as string,
          )

          console.log('Checkout concluído:', subscription.status)
        }
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log('Processing subscription event:', event.type);
        await handleProcessWebhookUpdatedSubscription(event.data);
        
        // Verificar se a assinatura está em um estado bloqueado
        const subscription = event.data.object as Stripe.Subscription;
        if (isSubscriptionBlocked(subscription.status)) {
          console.log(`Assinatura ${subscription.id} está bloqueada (${subscription.status}), desativando AIs`);
          
          // Encontrar o usuário para desativar as configurações
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { stripeSubscriptionId: subscription.id },
                { stripeCustomerId: subscription.customer as string }
              ]
            },
            select: { id: true }
          });
          
          if (user) {
            const result = await deactivateUserAIConfigs(user.id);
            console.log(`Resultado da desativação para usuário ${user.id}:`, result);
          }
        }
        break;

      case 'invoice.payment_failed':
      case 'invoice.paid':
        console.log('Processing invoice event:', event.type);
        // Buscar a assinatura atualizada para ter o status mais recente
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          // Se a assinatura estiver cancelada, não atualiza o status
          if (subscription.status === 'canceled') {
            console.log('Subscription is canceled, skipping status update');
            break;
          }
          
          // Se for falha no pagamento, verificar se deve desativar os AIConfigs
          if (event.type === 'invoice.payment_failed' && isSubscriptionBlocked(subscription.status)) {
            console.log(`Falha no pagamento para assinatura ${subscription.id}, desativando AIs`);
            
            // Encontrar o usuário para desativar as configurações
            const user = await prisma.user.findFirst({
              where: {
                OR: [
                  { stripeSubscriptionId: subscription.id },
                  { stripeCustomerId: subscription.customer as string }
                ]
              },
              select: { id: true }
            });
            
            if (user) {
              const result = await deactivateUserAIConfigs(user.id);
              console.log(`Resultado da desativação para usuário ${user.id}:`, result);
            }
          }
        }
        break;

      // Adicione outros eventos conforme necessário

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return new Response('Webhook received successfully', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Webhook processing error', { status: 500 })
  }
}
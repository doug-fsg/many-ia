import Stripe from 'stripe'

import { config } from '@/config'
import { prisma } from '../database'

export const stripe = new Stripe(config.stripe.secretKey || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

export const getStripeCustomerByEmail = async (email: string) => {
  const customers = await stripe.customers.list({ email })
  return customers.data[0]
}

export const createStripeCustomer = async (input: {
  name?: string
  email: string
}) => {
  const customer = await getStripeCustomerByEmail(input.email)
  if (customer) return customer

  const createdCustomer = await stripe.customers.create({
    email: input.email,
    name: input.name,
  })

  const createdCustomerSubscription = await stripe.subscriptions.create({
    customer: createdCustomer.id,
    items: [{ price: config.stripe.plans.free.priceId }],
  })

  await prisma.user.update({
    where: {
      email: input.email,
    },
    data: {
      stripeCustomerId: createdCustomer.id,
      stripeSubscriptionId: createdCustomerSubscription.id,
      stripeSubscriptionStatus: createdCustomerSubscription.status,
      stripePriceId: config.stripe.plans.free.priceId,
    },
  })

  return createdCustomer
}

export const createCheckoutSession = async (
  userId: string,
  userEmail: string,
  userStripeSubscriptionId: string,
) => {
  try {
    const customer = await createStripeCustomer({
      email: userEmail,
    })

    const subscription = await stripe.subscriptionItems.list({
      subscription: userStripeSubscriptionId,
      limit: 1,
    })

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: 'http://localhost:3000/app/settings/billing',
      flow_data: {
        type: 'subscription_update_confirm',
        after_completion: {
          type: 'redirect',
          redirect: {
            return_url:
              'http://localhost:3000/app/settings/billing?success=true',
          },
        },
        subscription_update_confirm: {
          subscription: userStripeSubscriptionId,
          items: [
            {
              id: subscription.data[0].id,
              price: config.stripe.plans.pro.priceId,
              quantity: 1,
            },
          ],
        },
      },
    })

    return {
      url: session.url,
    }
  } catch (error) {
    console.error(error)
    throw new Error('Error to create checkout session')
  }
}

export const handleProcessWebhookUpdatedSubscription = async (event: {
  object: Stripe.Subscription
}) => {
  const stripeCustomerId = event.object.customer as string
  const stripeSubscriptionId = event.object.id as string
  const stripeSubscriptionStatus = event.object.status
  const stripePriceId = event.object.items.data[0].price.id

  const userExists = await prisma.user.findFirst({
    where: {
      OR: [
        {
          stripeSubscriptionId,
        },
        {
          stripeCustomerId,
        },
      ],
    },
    select: {
      id: true,
    },
  })

  if (!userExists) {
    throw new Error('user of stripeCustomerId not found')
  }

  await prisma.user.update({
    where: {
      id: userExists.id,
    },
    data: {
      stripeCustomerId,
      stripeSubscriptionId,
      stripeSubscriptionStatus,
      stripePriceId,
    },
  })
}

type Plan = {
  priceId: string
  quota: {
    credits: number
  }
}

type Plans = {
  [key: string]: Plan
}

export const getPlanByPrice = (priceId: string) => {
  const plans: Plans = config.stripe.plans

  const planKey = Object.keys(plans).find(
    (key) => plans[key].priceId === priceId,
  ) as keyof Plans | undefined

  const plan = planKey ? plans[planKey] : null

  if (!plan) {
    throw new Error(`Plan not found for priceId: ${priceId}`)
  }

  return {
    name: planKey,
    quota: plan.quota,
  }
}

export const getUserCurrentPlan = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      stripePriceId: true,
    },
  })

  if (!user || !user.stripePriceId) {
    throw new Error('User or user stripePriceId not found')
  }

  const plan = getPlanByPrice(user.stripePriceId)

  // Buscar a soma de todas as interactionsCount do usuário no mês atual
  const interactions = await prisma.interaction.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(new Date().setDate(1)), // Início do mês atual
        lt: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Início do próximo mês
      },
    },
    select: {
      interactionsCount: true
    }
  })

  // Somar todos os interactionsCount
  const currentCredits = interactions.reduce((sum, interaction) => {
    return sum + (interaction.interactionsCount || 0);
  }, 0);

  const availableCredits = plan.quota.credits
  const usagePercentage = (currentCredits / availableCredits) * 100;

  return {
    name: plan.name,
    quota: {
      credits: {
        available: availableCredits,
        current: currentCredits,
        usage: usagePercentage
      }
    }
  }
}

export const createDirectCheckoutSession = async () => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      client_reference_id: Date.now().toString(),
      subscription_data: {
        metadata: {
          created_from: 'direct_checkout'
        }
      }
    });

    return { url: session.url };
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw new Error('Erro ao criar sessão de checkout');
  }
}

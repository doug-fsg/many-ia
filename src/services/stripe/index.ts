import Stripe from 'stripe'
import { cookies } from 'next/headers'

import { config } from '@/config'
import { prisma } from '../database'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY não configurada. O serviço de pagamentos Stripe não funcionará corretamente.')
}

// Mesmo que não exista a chave, inicializamos com string vazia para evitar erros de compilação
// Os erros específicos serão tratados nas funções que usam o Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
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

  // Verificar se existe um código de afiliado nos cookies
  const cookieStore = cookies()
  const affiliateRef = cookieStore.get('affiliate_ref')?.value

  const stripeCustomerData: Stripe.CustomerCreateParams = {
    email: input.email,
    name: input.name,
  }

  // Se existir código de afiliado, buscar a conta Stripe Connect do afiliado
  if (affiliateRef) {
    const affiliate = await prisma.affiliate.findFirst({
      where: { referralCode: affiliateRef },
      select: {
        stripeConnectAccountId: true,
        commissionRate: true
      }
    })

    if (affiliate?.stripeConnectAccountId) {
      // Adicionar metadata sobre o afiliado
      stripeCustomerData.metadata = {
        affiliate_account: affiliate.stripeConnectAccountId,
        commission_rate: affiliate.commissionRate?.toString() || '50'
      }
    }
  }

  const createdCustomer = await stripe.customers.create(stripeCustomerData)

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
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing`,
      flow_data: {
        type: 'subscription_update_confirm',
        after_completion: {
          type: 'redirect',
          redirect: {
            return_url:
              `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing?success=true`,
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const handleProcessWebhookUpdatedSubscription = async (event: {
  object: Stripe.Subscription
}) => {
  const stripeCustomerId = event.object.customer as string;
  const stripeSubscriptionId = event.object.id as string;
  const stripeSubscriptionStatus = event.object.status;
  const stripePriceId = event.object.items.data[0].price.id;

  // Tentar encontrar o usuário com até 3 tentativas
  let userExists = null;
  let attempts = 0;
  const maxAttempts = 3;
  const delayMs = 2000; // 2 segundos entre tentativas

  while (attempts < maxAttempts && !userExists) {
    console.log(`[STRIPE] Tentativa ${attempts + 1} de ${maxAttempts} para encontrar usuário - CustomerId: ${stripeCustomerId}`);
    
    userExists = await prisma.user.findFirst({
      where: {
        OR: [
          { stripeSubscriptionId },
          { stripeCustomerId },
        ],
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!userExists) {
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`[STRIPE] Usuário não encontrado, aguardando ${delayMs}ms antes da próxima tentativa...`);
        await delay(delayMs);
      }
    }
  }

  if (!userExists) {
    // Se após todas as tentativas o usuário ainda não existe, buscar informações do customer
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId) as Stripe.Customer;
      console.log('[STRIPE] Informações do customer no Stripe:', { 
        email: customer.email, 
        name: customer.name,
        metadata: customer.metadata 
      });
    } catch (error) {
      console.error('[STRIPE] Erro ao buscar informações do customer:', error);
    }
    
    throw new Error('user of stripeCustomerId not found');
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
  });

  console.log(`[STRIPE] Assinatura atualizada com sucesso para o usuário ${userExists.id}`);
};

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

export const createDirectCheckoutSession = async (cancelUrl?: string) => {
  try {
    // Verificar se existe um código de afiliado nos cookies
    const cookieStore = cookies();
    const affiliateRef = cookieStore.get('affiliate_ref')?.value;
    
    // Buscar o afiliado e sua taxa de comissão
    let subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
      metadata: {
        created_from: 'direct_checkout'
      }
    };
    
    if (affiliateRef) {
      const affiliate = await prisma.affiliate.findFirst({
        where: { referralCode: affiliateRef },
        select: {
          stripeConnectAccountId: true,
          commissionRate: true
        }
      });

      if (affiliate?.stripeConnectAccountId) {
        // Calcular a taxa de aplicação (inverso da comissão)
        const commissionRate = affiliate.commissionRate || 50;
        const applicationFeePercent = 100 - commissionRate;

        console.log(`[STRIPE] Configurando comissão de ${commissionRate}% para o afiliado no checkout`);

        subscriptionData = {
          ...subscriptionData,
          metadata: {
            ...subscriptionData.metadata,
            affiliate_ref: affiliateRef,
            affiliate_account: affiliate.stripeConnectAccountId,
            commission_rate: commissionRate.toString()
          },
          transfer_data: {
            destination: affiliate.stripeConnectAccountId,
            amount_percent: commissionRate // Porcentagem que vai para o afiliado
          }
        };
      }
    }
    
    // Construir a URL de sucesso com o código de afiliado, se existir
    let successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password?session_id={CHECKOUT_SESSION_ID}`;
    if (affiliateRef) {
      successUrl += `&affiliate_ref=${affiliateRef}`;
      console.log(`[STRIPE] Adicionando código de afiliado à URL de sucesso: ${affiliateRef}`);
    }
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      client_reference_id: Date.now().toString(),
      subscription_data: subscriptionData
    });

    return { url: session.url };
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw new Error('Erro ao criar sessão de checkout');
  }
}

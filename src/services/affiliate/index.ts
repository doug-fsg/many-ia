import { prisma } from '../database'
import { stripe } from '../stripe'
import { nanoid } from 'nanoid'

export async function createAffiliateAccount(userId: string) {
  // Verificar se o usuário já é um afiliado
  const existingAffiliate = await prisma.affiliate.findUnique({
    where: { userId }
  })

  if (existingAffiliate) {
    throw new Error('Usuário já é um afiliado')
  }

  // Criar conta Stripe Connect
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true }
  })

  if (!user?.email) {
    throw new Error('Usuário não encontrado ou sem email')
  }

  // Criar conta Stripe Connect Express
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'BR',
    email: user.email,
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
      userId,
      stripeConnectAccountId: account.id,
      referralCode,
      status: 'pending'
    }
  })

  return affiliate
}

export async function getAffiliateAccountLink(userId: string, returnUrl: string) {
  const affiliate = await prisma.affiliate.findUnique({
    where: { userId }
  })

  if (!affiliate?.stripeConnectAccountId) {
    throw new Error('Conta de afiliado não encontrada')
  }

  const accountLink = await stripe.accountLinks.create({
    account: affiliate.stripeConnectAccountId,
    refresh_url: `${returnUrl}?refresh=true`,
    return_url: `${returnUrl}?success=true`,
    type: 'account_onboarding',
  })

  return accountLink
}

export async function getAffiliateByUserId(userId: string) {
  return prisma.affiliate.findUnique({
    where: { userId },
    include: {
      referrals: true
    }
  })
}

export async function getAffiliateByReferralCode(referralCode: string) {
  return prisma.affiliate.findFirst({
    where: { referralCode }
  })
}

export async function createReferral(affiliateId: string, referredUserId: string) {
  // Verificar se já existe referral
  const existingReferral = await prisma.referral.findFirst({
    where: {
      referredUserId
    }
  })

  if (existingReferral) {
    throw new Error('Usuário já foi referenciado por outro afiliado')
  }

  return prisma.referral.create({
    data: {
      affiliateId,
      referredUserId,
      status: 'pending'
    }
  })
}

export async function updateAffiliateStatus(userId: string, status: string) {
  return prisma.affiliate.update({
    where: { userId },
    data: { status }
  })
}

export async function getReferralsByAffiliateId(affiliateId: string) {
  return prisma.referral.findMany({
    where: { affiliateId },
    include: {
      referredUser: {
        select: {
          email: true,
          name: true,
          stripeSubscriptionStatus: true
        }
      }
    }
  })
} 
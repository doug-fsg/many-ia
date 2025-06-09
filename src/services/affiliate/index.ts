import { stripe } from '@/services/stripe'
import { prisma } from '@/services/database'
import { nanoid } from 'nanoid'

export async function createAffiliateAccount(userId: string) {
  // Verificar se já é afiliado
  const existingAffiliate = await prisma.affiliate.findUnique({
    where: { userId }
  })

  if (existingAffiliate) {
    throw new Error('Você já é um afiliado')
  }

  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  })

  if (!user?.email) {
    throw new Error('Usuário não encontrado')
  }

  // Criar conta Stripe Connect
  let account;
  try {
    account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    });
  } catch (error: any) {
    console.error('Erro ao criar conta Stripe Connect:', error.message);
    throw new Error(`Não foi possível criar a conta de afiliado: ${error.message}`);
  }

  if (!account || !account.id) {
    throw new Error('Não foi possível criar a conta no Stripe. Verifique as configurações de API.')
  }

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

  try {
    return await stripe.accountLinks.create({
      account: affiliate.stripeConnectAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate-program/onboarding/refresh`,
      return_url: returnUrl,
      type: 'account_onboarding',
    })
  } catch (error: any) {
    console.error('Erro ao criar link da conta Stripe:', error.message);
    throw new Error(`Não foi possível gerar o link de configuração: ${error.message}`);
  }
}

export async function getAffiliateByUserId(userId: string) {
  return prisma.affiliate.findUnique({
    where: { userId },
    include: {
      referrals: {
        include: {
          referredUser: {
            select: {
              email: true,
              stripeSubscriptionStatus: true
            }
          }
        }
      }
    }
  })
}

export async function getAffiliateByReferralCode(referralCode: string) {
  return prisma.affiliate.findFirst({
    where: { referralCode }
  })
}

export async function createReferral(affiliateId: string, referredUserId: string) {
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
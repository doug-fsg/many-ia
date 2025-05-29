'use server'

import { auth } from '@/services/auth'
import { createAffiliateAccount as createAffiliate, getAffiliateAccountLink } from '@/services/affiliate'

export async function createAffiliateAccount() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Usuário não autenticado')
  }

  try {
    // Criar conta de afiliado
    const affiliate = await createAffiliate(session.user.id)

    // Gerar link do Stripe Connect
    const accountLink = await getAffiliateAccountLink(
      session.user.id,
      `${process.env.NEXT_PUBLIC_APP_URL}/affiliate-program/dashboard`
    )

    return {
      success: true,
      accountLink: accountLink.url
    }
  } catch (error) {
    console.error('Erro ao criar conta de afiliado:', error)
    throw error
  }
} 
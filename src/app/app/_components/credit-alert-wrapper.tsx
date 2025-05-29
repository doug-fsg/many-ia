import { getUserCurrentPlan } from '@/services/stripe'
import CreditAlert from './credit-alert'
import { prisma } from '@/services/database'

export async function CreditAlertWrapper({ userId }: { userId: string }) {
  try {
    // Buscar o usuário primeiro para verificar se tem um plano do Stripe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        stripeSubscriptionStatus: true,
        stripePriceId: true
      }
    })

    // Valores padrão caso o usuário não tenha um plano
    let isOutOfCredits = false
    let hasOverdueInvoice = false

    // Se o usuário tem um plano de assinatura, verificar os créditos
    if (user?.stripePriceId) {
      try {
        const plan = await getUserCurrentPlan(userId)
        const creditsUsed = plan.quota.credits?.current || 0
        const totalCredits = plan.quota.credits?.available || 10000
        isOutOfCredits = creditsUsed >= totalCredits
      } catch (error) {
        console.error('Erro ao verificar plano:', error)
        // Manter os valores padrão em caso de erro
      }
    }

    // Verificar se há faturas vencidas
    hasOverdueInvoice = user?.stripeSubscriptionStatus === 'past_due' || 
                        user?.stripeSubscriptionStatus === 'unpaid'

    return <CreditAlert 
      isOutOfCredits={isOutOfCredits} 
      hasOverdueInvoice={hasOverdueInvoice} 
    />
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return null
  }
} 
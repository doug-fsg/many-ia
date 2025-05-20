import { getUserCurrentPlan } from '@/services/stripe'
import CreditAlert from './credit-alert'
import { prisma } from '@/services/database'

export async function CreditAlertWrapper({ userId }: { userId: string }) {
  try {
    // Verifica créditos
    const plan = await getUserCurrentPlan(userId)
    const creditsUsed = plan.quota.credits?.current || 0
    const totalCredits = plan.quota.credits?.available || 10000
    const isOutOfCredits = creditsUsed >= totalCredits

    // Verifica fatura vencida
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        stripeSubscriptionStatus: true
      }
    })

    const hasOverdueInvoice = user?.stripeSubscriptionStatus === 'past_due' || 
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
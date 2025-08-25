import { getUserCurrentPlan } from '@/services/stripe'
import CreditAlert from './credit-alert'
import { prisma } from '@/services/database'

export async function CreditAlertWrapper({ userId }: { userId: string }) {
  try {
    // Verifica créditos
    const plan = await getUserCurrentPlan(userId)
    const creditsUsed = plan.quota.credits?.current || 0
    const totalCredits = plan.quota.credits?.available
    
    // Se não conseguir obter o limite de créditos, não mostrar alerta
    if (!totalCredits) {
      return null
    }
    
    const isOutOfCredits = creditsUsed >= totalCredits

    // Se créditos excedidos, desativar todas as configurações automaticamente
    if (isOutOfCredits) {
      const { deactivateUserAIConfigs } = await import('@/lib/subscription-helper')
      await deactivateUserAIConfigs(userId)
    }

    // Verifica fatura vencida
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        stripeSubscriptionStatus: true,
        email: true // Adicionado para log
      }
    })

    const hasOverdueInvoice = user?.stripeSubscriptionStatus === 'past_due' || 
                             user?.stripeSubscriptionStatus === 'unpaid'

    // Log removido para produção

    return <CreditAlert 
      isOutOfCredits={isOutOfCredits} 
      hasOverdueInvoice={hasOverdueInvoice} 
    />
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return null
  }
} 
import { getUserCurrentPlan } from '@/services/stripe'
import CreditAlert from './credit-alert'
import { prisma } from '@/services/database'

// Cache simples para evitar webhooks duplicados (resetado a cada restart da aplicação)
const webhookCache = new Map<string, number>()

// Função para enviar webhook de alerta de créditos
async function sendCreditWebhook(userId: string, userEmail: string, percentage: number, creditsUsed: number, totalCredits: number) {
  const webhookUrl = process.env.WEBHOOK
  if (!webhookUrl) {
    console.log('[WEBHOOK] URL não configurada, pulando envio')
    return
  }

  try {
    const payload = {
      event: 'credit_alert',
      userId,
      userEmail,
      percentage,
      creditsUsed,
      totalCredits,
      timestamp: new Date().toISOString()
    }

    console.log(`[WEBHOOK] Enviando alerta de ${percentage}% para ${userEmail}`)
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    console.log(`[WEBHOOK] Alerta de ${percentage}% enviado com sucesso`)
  } catch (error) {
    console.error(`[WEBHOOK] Erro ao enviar alerta de ${percentage}%:`, error)
  }
}

export async function CreditAlertWrapper({ userId }: { userId: string }) {
  try {
    // Verifica créditos
    const plan = await getUserCurrentPlan(userId)
    const creditsUsed = plan.quota.credits?.current || 0
    const totalCredits = plan.quota.credits?.available
    
    console.log(`[CREDIT-ALERT] Verificação para usuário ${userId}:`, {
      creditsUsed,
      totalCredits,
      isOutOfCredits: creditsUsed >= totalCredits
    });
    
    // Se não conseguir obter o limite de créditos, não mostrar alerta
    if (!totalCredits) {
      console.log(`[CREDIT-ALERT] Sem limite definido para usuário ${userId}`);
      return null
    }
    
    const usagePercentage = (creditsUsed / totalCredits) * 100
    const isOutOfCredits = creditsUsed >= totalCredits

    // Obter email do usuário para webhook
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true,
        stripeSubscriptionStatus: true
      }
    })

    if (!user) {
      console.log(`[CREDIT-ALERT] Usuário ${userId} não encontrado`);
      return null
    }

    // Verificar e enviar webhooks para percentuais específicos
    const webhookThresholds = [70, 80, 90, 100]
    let highestThresholdReached = 0
    
    console.log(`[WEBHOOK-DEBUG] Usuário ${user.email}: ${usagePercentage.toFixed(2)}% de uso`);
    
    // Encontrar o maior threshold atingido
    for (const threshold of webhookThresholds) {
      if (usagePercentage >= threshold) {
        highestThresholdReached = threshold
        console.log(`[WEBHOOK-DEBUG] Threshold ${threshold}% atingido`);
      }
    }
    
    console.log(`[WEBHOOK-DEBUG] Maior threshold: ${highestThresholdReached}%`);
    
    // Enviar webhook para o maior threshold atingido
    if (highestThresholdReached > 0) {
      const cacheKey = `${userId}-${highestThresholdReached}`
      const lastSent = webhookCache.get(cacheKey) || 0
      const now = Date.now()
      const timeSinceLastSent = (now - lastSent) / (1000 * 60 * 60) // em horas
      
      console.log(`[WEBHOOK-DEBUG] Cache key: ${cacheKey}, última vez enviado: ${timeSinceLastSent.toFixed(1)}h atrás`);
      
      // Enviar apenas se não foi enviado nas últimas 24 horas
      if (now - lastSent > 24 * 60 * 60 * 1000) {
        console.log(`[WEBHOOK-DEBUG] Enviando webhook de ${highestThresholdReached}%`);
        await sendCreditWebhook(userId, user.email, highestThresholdReached, creditsUsed, totalCredits)
        webhookCache.set(cacheKey, now)
      } else {
        console.log(`[WEBHOOK-DEBUG] Webhook de ${highestThresholdReached}% bloqueado pelo cache (${timeSinceLastSent.toFixed(1)}h < 24h)`);
      }
    } else {
      console.log(`[WEBHOOK-DEBUG] Nenhum threshold atingido para ${usagePercentage.toFixed(2)}%`);
    }

    // Se créditos excedidos, desativar todas as configurações automaticamente
    if (isOutOfCredits) {
      console.log(`[CREDIT-ALERT] LIMITE EXCEDIDO para usuário ${userId}. Desativando configurações...`);
      const { deactivateUserAIConfigs } = await import('@/lib/subscription-helper')
      const result = await deactivateUserAIConfigs(userId)
      console.log(`[CREDIT-ALERT] Resultado da desativação:`, result);
    }

    // Verifica fatura vencida (usando user já carregado)
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
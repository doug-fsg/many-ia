'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type SubscriptionStatus = {
  isBlocked: boolean
  hasSubscription: boolean
  subscriptionStatus: string | null
  error: string | null
}

export function useSubscriptionCheck(redirectToAffiliate = true) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/subscription-status')
        
        if (response.ok) {
          const data = await response.json()
          setStatus(data)
          
          // Se não tiver assinatura e o redirecionamento estiver ativado, redireciona
          if (redirectToAffiliate && (!data.hasSubscription || data.isBlocked)) {
            router.push('/app/templates/affiliate')
          }
        } else {
          console.error('Erro ao verificar assinatura:', await response.text())
        }
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [redirectToAffiliate, router])

  return { status, loading }
} 
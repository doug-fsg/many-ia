'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useDashUser } from '@/hooks/use-dash-user'

export default function CheckAffiliatePage() {
  const router = useRouter()
  const { user, isLoading } = useDashUser()

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (isLoading || !user) return

      // Verificar se o usuário é um afiliado sem assinatura
      // Usuários de integração (isIntegrationUser=true) têm acesso gratuito
      const isAffiliateWithoutSub = user.isAffiliate && !user.hasSubscription && !user.isIntegrationUser

      if (isAffiliateWithoutSub) {
        // Redirecionar para a página de templates para afiliados
        console.log('Redirecionando afiliado sem assinatura para página de templates')
        router.push('/app/templates/affiliate')
      } else {
        // Usuário normal ou com acesso gratuito, redirecionar para app
        console.log('Redirecionando usuário para /app')
        router.push('/app')
      }
    }

    checkAndRedirect()
  }, [user, isLoading, router])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verificando seu acesso...</p>
      </div>
    </div>
  )
} 
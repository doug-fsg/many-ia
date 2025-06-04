'use client'

import React from 'react'
import { useSubscriptionCheck } from '@/hooks/use-subscription-check'
import { SubscriptionRequiredClient } from './subscription-required-client'

interface SubscriptionGuardClientProps {
  title: string
  description: string
  children: React.ReactNode
  redirectToAffiliate?: boolean
}

export function SubscriptionGuardClient({
  title,
  description,
  children,
  redirectToAffiliate = false
}: SubscriptionGuardClientProps) {
  const { status, loading } = useSubscriptionCheck(redirectToAffiliate)
  
  // Se ainda estiver carregando, pode mostrar um indicador de carregamento
  if (loading) {
    return <div className="flex items-center justify-center h-full p-8">Carregando...</div>
  }
  
  // Se o usuário não tem uma assinatura ou a assinatura está bloqueada
  if (status && (!status.hasSubscription || status.isBlocked)) {
    return (
      <SubscriptionRequiredClient 
        title={title} 
        description={description} 
      />
    )
  }
  
  // Se o usuário tem uma assinatura válida, mostrar o conteúdo normal
  return <>{children}</>
} 
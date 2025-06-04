import React from 'react';
import { checkUserSubscription } from '@/lib/subscription-helper';
import { SubscriptionRequired } from './subscription-required';
import { redirect } from 'next/navigation';

interface SubscriptionGuardProps {
  userId: string;
  title: string;
  description: string;
  children: React.ReactNode;
  redirectToAffiliate?: boolean;
}

export async function SubscriptionGuard({
  userId,
  title,
  description,
  children,
  redirectToAffiliate = true
}: SubscriptionGuardProps) {
  // Verificar status da assinatura do usuário
  const subscriptionStatus = await checkUserSubscription(userId);
  
  // Se o usuário não tem uma assinatura ou a assinatura está bloqueada
  if (!subscriptionStatus.hasSubscription || subscriptionStatus.isBlocked) {
    // Se a opção de redirecionamento estiver ativada, redirecionar para a página de afiliados
    if (redirectToAffiliate) {
      redirect('/app/templates/affiliate');
    }
    
    // Caso contrário, mostrar o componente de requisito de assinatura
    return (
      <SubscriptionRequired 
        title={title} 
        description={description} 
      />
    );
  }
  
  // Se o usuário tem uma assinatura válida, mostrar o conteúdo normal
  return <>{children}</>;
} 
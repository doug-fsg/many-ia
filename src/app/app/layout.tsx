import { MainSidebar } from './_components/main-sidebar'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-helper'
import { CreditAlertWrapper } from './_components/credit-alert-wrapper'
import { prisma } from '@/services/database'
import { headers } from 'next/headers'

// Configuração para marcar o layout como dinâmico
export const dynamic = 'force-dynamic';

// Função para verificar se o usuário é afiliado sem assinatura
async function isAffiliateWithoutSubscription(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        canCreateTemplates: true,
        stripeSubscriptionId: true
      }
    });
    
    return !!(user && user.canCreateTemplates && !user.stripeSubscriptionId);
  } catch (error) {
    console.error('[LAYOUT] Erro ao verificar status de afiliado:', error);
    return false;
  }
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser();
  
  // Se o usuário não estiver autenticado, redirecionar para o login
  if (!user) {
    redirect('/auth');
  }

  return (
    <>
      <CreditAlertWrapper userId={user.id} />
      <div className="flex flex-col md:flex-row">
        <MainSidebar user={user} />
        <main className="flex-1 md:ml-64 min-h-screen w-full">
          {children}
        </main>
      </div>
    </>
  )
}

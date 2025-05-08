import { MainSidebar } from './_components/main-sidebar'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-helper'

// Configuração para marcar o layout como dinâmico
export const dynamic = 'force-dynamic';

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
    <div className="flex flex-col md:flex-row">
      <MainSidebar user={user} />
      <main className="flex-1 md:ml-64 min-h-screen w-full">
        {children}
      </main>
    </div>
  )
}

import { MainSidebar } from './_components/main-sidebar'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-helper'

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
    <div className="flex">
      <MainSidebar user={user} />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}

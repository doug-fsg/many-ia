import { MainSidebar } from './_components/main-sidebar'
import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth')
  }

  return (
    <div className="flex">
      <MainSidebar user={session.user} />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}

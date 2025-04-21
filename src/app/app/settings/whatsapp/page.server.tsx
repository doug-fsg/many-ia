import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import WhatsAppPage from './page'

export default async function WhatsAppPageServer() {
  const session = await auth()
  
  // Verificar se o usuário está autenticado
  if (!session?.user?.id) {
    redirect('/auth')
  }
  
  return (
    <WhatsAppPage 
      userId={session.user.id} 
      isIntegrationUser={!!session.user.isIntegrationUser} 
    />
  )
} 
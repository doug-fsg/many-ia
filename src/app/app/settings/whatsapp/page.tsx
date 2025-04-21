import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import WhatsAppClient from './client'
import { prisma } from '@/services/database'

export default async function WhatsAppPage() {
  const session = await auth()
  
  // Verificar se o usuário está autenticado
  if (!session?.user?.id) {
    console.log('[WHATSAPP-PAGE] Usuário não autenticado, redirecionando para /auth')
    redirect('/auth')
  }
  
  // Verificação adicional no banco de dados para o status de integração
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    // Se for usuário de integração, redirecionar para as configurações
    if (dbUser?.isIntegrationUser) {
      console.log('[WHATSAPP-PAGE] Acesso bloqueado para usuário de integração:', session.user.email)
      redirect('/app/settings')
    }
  } catch (error) {
    console.error('[WHATSAPP-PAGE] Erro ao verificar status de integração:', error)
    // Em caso de erro, usar o valor da sessão
    if (session.user.isIntegrationUser) {
      console.log('[WHATSAPP-PAGE] Acesso bloqueado por valor da sessão para:', session.user.email)
      redirect('/app/settings')
    }
  }
  
  console.log('[WHATSAPP-PAGE] Acesso permitido para:', session.user.email)
  
  return (
    <WhatsAppClient 
      userId={session.user.id} 
      isIntegrationUser={false} // Já garantimos que não é usuário de integração
    />
  )
} 
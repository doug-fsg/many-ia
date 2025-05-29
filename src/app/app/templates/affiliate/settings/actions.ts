'use server'

import { auth } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function processPendingCommissions() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { 
        success: false, 
        error: 'Usuário não autenticado' 
      }
    }

    // Obter o cookie de sessão para incluir na requisição
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('next-auth.session-token')?.value

    // Chamar a API para processar comissões pendentes
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/process-pending-commissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Incluir o token de sessão no cabeçalho para garantir a autenticação
        'Authorization': `Bearer ${sessionToken || ''}`,
      },
      // Enviar um objeto vazio para evitar erro de JSON.parse
      body: JSON.stringify({
        userId: session.user.id // Incluir ID do usuário explicitamente
      }),
      // Incluir cookies para autenticação
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      return { 
        success: false, 
        error: errorData.error || `Erro ${response.status}: ${response.statusText}` 
      }
    }

    const result = await response.json()
    
    // Revalidar o caminho para atualizar a UI
    revalidatePath('/app/templates/affiliate')
    revalidatePath('/app/templates/affiliate/settings')
    
    return { 
      success: true, 
      data: result 
    }
  } catch (error: any) {
    console.error('Erro ao processar comissões pendentes:', error)
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido ao processar comissões' 
    }
  }
} 
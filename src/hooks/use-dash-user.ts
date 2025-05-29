'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type User = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  isAffiliate: boolean
  hasSubscription: boolean
  isIntegrationUser: boolean
}

export function useDashUser() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true)
        console.log('[useDashUser] Buscando informações do usuário via API...')
        const response = await fetch('/api/user/info')
        
        if (response.ok) {
          const data = await response.json()
          
          // Verificar se o usuário é um afiliado
          const isAffiliate = data.isAffiliate === true
          
          // Verificar se o usuário tem uma assinatura
          const hasSubscription = !!data.stripePriceId || data.hasActiveSubscription === true
          
          // Verificar se é um usuário de integração
          const isIntegrationUser = data.isIntegrationUser === true
          
          // Combinar dados da sessão com dados da API
          setUser({
            id: data.id || session?.user?.id || '',
            name: data.name || session?.user?.name || null,
            email: data.email || session?.user?.email || null,
            image: data.image || session?.user?.image || null,
            isAffiliate,
            hasSubscription,
            isIntegrationUser
          })
          
          console.log('[useDashUser] Dados do usuário:', {
            isAffiliate,
            hasSubscription,
            isIntegrationUser,
            user: data
          })
        } else {
          console.error('[useDashUser] Erro ao buscar informações do usuário:', await response.text())
          setError('Falha ao buscar informações do usuário')
        }
      } catch (error) {
        console.error('[useDashUser] Erro ao buscar informações do usuário:', error)
        setError('Erro ao processar informações do usuário')
      } finally {
        setIsLoading(false)
      }
    }
    
    // Só buscar dados quando tiver uma sessão
    if (status === 'authenticated') {
      fetchUserInfo()
    } else if (status === 'unauthenticated') {
      setIsLoading(false)
      setUser(null)
    }
  }, [session, status])

  return { user, isLoading, error }
} 
'use client'

import { redirect } from 'next/navigation'
import { useEffect, useState, PropsWithChildren } from 'react'

export default function TemplatesLayout({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true)
  const [canAccess, setCanAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/user/info')
        if (response.ok) {
          const data = await response.json()
          if (data.canCreateTemplates) {
            setCanAccess(true)
          } else {
            // Redirecionar o usuário se ele não tem permissão
            console.log('[MODELOS] Usuário não tem permissão para acessar modelos')
            redirect('/app')
          }
        } else {
          console.error('[MODELOS] Erro ao verificar permissões:', await response.text())
          redirect('/app')
        }
      } catch (error) {
        console.error('[MODELOS] Erro ao verificar permissões:', error)
        redirect('/app')
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  return children
} 
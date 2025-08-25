'use client'

import {
  DashboardSidebarNav,
  DashboardSidebarNavLink,
  DashboardSidebarNavMain,
} from '@/components/dashboard/sidebar'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

// Verificação baseada em NEXT_PUBLIC_DEBUG_MODE para acesso no cliente
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

export function SettingsSidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Valor da sessão do NextAuth
  const isIntegrationUser = session?.user?.isIntegrationUser
  
  // Valor do backend como fallback (mais confiável)
  const isIntegrationUserFromBackend = userInfo?.isIntegrationUser
  
  // SEMPRE dar prioridade ao valor do backend, que é mais confiável
  // Esta é a chave da correção - o valor do backend sempre prevalece
  const shouldHideWhatsApp = isIntegrationUserFromBackend !== undefined 
    ? isIntegrationUserFromBackend 
    : isIntegrationUser

  // Verificar se o usuário está autenticado via API, mesmo que o status do NextAuth seja "unauthenticated"
  const isAuthenticated = !!session?.user || !!userInfo

  useEffect(() => {
    // Buscar informações do usuário no backend para verificação adicional
    const fetchUserInfo = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/info')
        if (response.ok) {
          const data = await response.json()
          setUserInfo(data)
        } else {
          console.error('[SETTINGS-SIDEBAR] Erro ao buscar informações do usuário:', await response.text())
        }
      } catch (error) {
        console.error('[SETTINGS-SIDEBAR] Erro ao buscar informações do usuário:', error)
      } finally {
        setLoading(false)
      }
    }
    
    // Sempre buscar informações do usuário, mesmo se não tiver sessão NextAuth
    // Isso é importante para lidar com o caso em que o usuário está autenticado
    // via cookie direto (API Many), mas o hook useSession() reporta unauthenticated
    fetchUserInfo()
  }, [session, status])

  // Log removido para produção

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <aside>
      <DashboardSidebarNav>
        <DashboardSidebarNavMain>
          <DashboardSidebarNavLink
            href="/app/settings"
            active={isActive('/app/settings')}
          >
            Meu perfil
          </DashboardSidebarNavLink>
          <DashboardSidebarNavLink
            href="/app/settings/theme"
            active={isActive('/app/settings/theme')}
          >
            Aparência
          </DashboardSidebarNavLink>
          <DashboardSidebarNavLink
            href="/app/settings/billing"
            active={isActive('/app/settings/billing')}
          >
            Assinatura
          </DashboardSidebarNavLink>
          {/* Só exibir o menu do WhatsApp se temos certeza de que NÃO é um usuário de integração */}
          {isAuthenticated && !loading && !shouldHideWhatsApp && (
            <DashboardSidebarNavLink
              href="/app/settings/whatsapp"
              active={isActive('/app/settings/whatsapp')}
            >
              WhatsApp
            </DashboardSidebarNavLink>
          )}
          {loading && (
            <div className="py-2 px-3 text-xs text-muted-foreground">
              Verificando permissões...
            </div>
          )}
          
          {/* Botão de diagnóstico - visível apenas quando DEBUG_MODE está ativo */}
          {isDebugEnabled && (
            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Ferramentas de desenvolvimento</p>
              <a 
                href="/api/auth/debug/cookies" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center mb-2"
              >
                Diagnosticar cookies de sessão
              </a>
              
              <div className="flex space-x-1 mb-2">
                <a 
                  href="/api/auth/debug/integration-status?set=true" 
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-800 py-1 px-2 rounded"
                  onClick={(e) => {
                    e.preventDefault()
                    fetch('/api/auth/debug/integration-status?set=true')
                      .then(response => response.json())
                      .then(data => {
                        window.location.reload()
                      })
                  }}
                >
                  Ativar modo integração
                </a>
                <a 
                  href="/api/auth/debug/integration-status?set=false" 
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-800 py-1 px-2 rounded"
                  onClick={(e) => {
                    e.preventDefault()
                    fetch('/api/auth/debug/integration-status?set=false')
                      .then(response => response.json())
                      .then(data => {
                        window.location.reload()
                      })
                  }}
                >
                  Desativar modo integração
                </a>
              </div>
              
              <div className="mt-2 text-xs">
                <p>
                  <span className="font-semibold">isIntegrationUser (sessão):</span> {isIntegrationUser ? 'Sim' : 'Não'}
                </p>
                <p>
                  <span className="font-semibold">isIntegrationUser (API):</span> {isIntegrationUserFromBackend ? 'Sim' : 'Não'}
                </p>
                <p>
                  <span className="font-semibold">Ocultar WhatsApp:</span> {shouldHideWhatsApp ? 'Sim' : 'Não'}
                </p>
                <p>
                  <span className="font-semibold">Autenticado:</span> {isAuthenticated ? 'Sim' : 'Não'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Status da sessão: {status}
                </p>
              </div>
            </div>
          )}
        </DashboardSidebarNavMain>
      </DashboardSidebarNav>
    </aside>
  )
}

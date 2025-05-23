'use client'

import {
  DashboardSidebar,
  DashboardSidebarHeader,
  DashboardSidebarMain,
  DashboardSidebarNav,
  DashboardSidebarNavMain,
  DashboardSidebarNavLink,
  DashboardSidebarNavHeader,
  DashboardSidebarNavHeaderTitle,
  DashboardSidebarFooter,
} from '@/components/dashboard/sidebar'
import { usePathname } from 'next/navigation'
import { 
  Sparkles, 
  LayoutDashboard, 
  Settings,
  HelpCircle,
  Globe,
  Menu,
  X,
  FileText
} from 'lucide-react'
import { UserDropdown } from './user-dropdown'
import { Logo } from '@/components/logo'
import { AuthUser } from '@/lib/auth-helper'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'

type MainSidebarProps = {
  user: AuthUser
}

export function MainSidebar({ user }: MainSidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Buscar informações completas do usuário da API
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/info')
        if (response.ok) {
          const data = await response.json()
          setUserInfo(data)
          console.log('[MAIN-SIDEBAR] Informações do usuário obtidas via API:', data)
        } else {
          console.error('[MAIN-SIDEBAR] Erro ao buscar informações do usuário:', await response.text())
        }
      } catch (error) {
        console.error('[MAIN-SIDEBAR] Erro ao buscar informações do usuário:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserInfo()
  }, [])

  // Verifique se o usuário pode criar templates
  const canCreateTemplates = userInfo?.canCreateTemplates === true

  // Lista de itens de menu básicos (sempre visíveis)
  const baseMenuItems = [
    {
      href: '/app',
      icon: <Sparkles className="w-4 h-4 mr-3" />,
      label: 'Personalize sua IA',
      mobileLabel: 'Atendente'
    },
    {
      href: '/app/dashboard',
      icon: <LayoutDashboard className="w-4 h-4 mr-3" />,
      label: 'Dashboard',
      mobileLabel: 'Dashboard'
    },
    {
      href: '/app/settings',
      icon: <Settings className="w-4 h-4 mr-3" />,
      label: 'Configurações',
      mobileLabel: 'Config.'
    }
  ]

  // Item de menu de Templates (condicional)
  const templatesMenuItem = {
    href: '/app/templates',
    icon: <FileText className="w-4 h-4 mr-3" />,
    label: 'Meus Modelos',
    mobileLabel: 'Modelos'
  }

  // Menu final com ou sem o item Templates
  const menuItems = canCreateTemplates 
    ? [...baseMenuItems.slice(0, 2), templatesMenuItem, baseMenuItems[2]] 
    : baseMenuItems

  const extraLinks = [
    {
      href: '/help',
      icon: <HelpCircle className="w-4 h-4 mr-3" />,
      label: 'Precisa de ajuda?'
    },
    {
      href: '/',
      icon: <Globe className="w-4 h-4 mr-3" />,
      label: 'Site'
    }
  ]

  // Detectar se estamos em um dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  // Fechar o menu ao navegar para uma nova página em dispositivos móveis
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }, [pathname, isMobile])

  const isActive = (path: string) => {
    return pathname === path
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border/40 z-50">
        <nav className="flex justify-around items-center h-16 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 py-1 text-xs transition-colors",
                isActive(item.href) 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {React.cloneElement(item.icon, { 
                className: "w-5 h-5 mb-1",
                strokeWidth: isActive(item.href) ? 2.5 : 1.5
              })}
              <span className="text-[10px] text-center">{item.mobileLabel}</span>
            </Link>
          ))}
          <div className="flex flex-col items-center justify-center w-16 py-1">
            <UserDropdown user={user} isMobile={true} />
          </div>
        </nav>
      </div>

      {/* Ajuste para centralizar os cards no mobile */}
      <style jsx global>{`
        @media (max-width: 768px) {
          main > div > div {
            justify-content: center !important;
          }
        }
      `}</style>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar 
          className="fixed left-0 top-0 bottom-0 w-64 z-50"
        >
          <DashboardSidebarHeader>
            <Logo />
          </DashboardSidebarHeader>
          <DashboardSidebarMain className="flex flex-col flex-grow overflow-y-auto">
            <DashboardSidebarNav>
              <DashboardSidebarNavMain>
                {menuItems.map((item) => (
                  <DashboardSidebarNavLink 
                    key={item.href}
                    href={item.href} 
                    active={isActive(item.href)}
                  >
                    {item.icon}
                    {item.label}
                  </DashboardSidebarNavLink>
                ))}
              </DashboardSidebarNavMain>
            </DashboardSidebarNav>

            <DashboardSidebarNav className="mt-auto pt-6">
              <DashboardSidebarNavHeader>
                <DashboardSidebarNavHeaderTitle>
                  Links extras
                </DashboardSidebarNavHeaderTitle>
              </DashboardSidebarNavHeader>
              <DashboardSidebarNavMain>
                {extraLinks.map((item) => (
                  <DashboardSidebarNavLink 
                    key={item.href}
                    href={item.href}
                    active={isActive(item.href)}
                  >
                    {item.icon}
                    {item.label}
                  </DashboardSidebarNavLink>
                ))}
              </DashboardSidebarNavMain>
            </DashboardSidebarNav>
          </DashboardSidebarMain>
          <DashboardSidebarFooter>
            <UserDropdown user={user} />
          </DashboardSidebarFooter>
        </DashboardSidebar>
      </div>
    </>
  )
}

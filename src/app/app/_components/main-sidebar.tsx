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
  HomeIcon,
  MixerVerticalIcon,
  DashboardIcon,
  HamburgerMenuIcon,
  Cross1Icon,
} from '@radix-ui/react-icons'
import { UserDropdown } from './user-dropdown'
import { Logo } from '@/components/logo'
import { AuthUser } from '@/lib/auth-helper'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

type MainSidebarProps = {
  user: AuthUser
}

export function MainSidebar({ user }: MainSidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleMobileMenu}
          className="h-10 w-10"
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-sidebar"
        >
          {isMobileMenuOpen ? 
            <Cross1Icon className="w-4 h-4" /> : 
            <HamburgerMenuIcon className="w-4 h-4" />
          }
        </Button>
      </div>

      <div 
        id="mobile-sidebar"
        aria-hidden={isMobile && !isMobileMenuOpen}
      >
        <DashboardSidebar 
          className={`${isMobile ? 'fixed left-0 top-0 bottom-0 w-64 z-40 transition-transform duration-300 ease-in-out transform' : 'fixed left-0 top-0 bottom-0 w-64 z-50'} ${
            isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'
          }`}
        >
          <DashboardSidebarHeader>
            <Logo />
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMobileMenu}
                className="absolute top-4 right-4 md:hidden"
                aria-label="Fechar menu"
              >
                <Cross1Icon className="w-4 h-4" />
              </Button>
            )}
          </DashboardSidebarHeader>
          <DashboardSidebarMain className="flex flex-col flex-grow overflow-y-auto">
            <DashboardSidebarNav>
              <DashboardSidebarNavMain>
                <DashboardSidebarNavLink href="/app" active={isActive('/app')}>
                  <HomeIcon className="w-3 h-3 mr-3" />
                  Inteligência Artificial
                </DashboardSidebarNavLink>
                <DashboardSidebarNavLink
                  href="/app/dashboard"
                  active={isActive('/app/dashboard')}
                >
                  <DashboardIcon className="w-3 h-3 mr-3" />
                  Dashboard
                </DashboardSidebarNavLink>
                <DashboardSidebarNavLink
                  href="/app/settings"
                  active={isActive('/app/settings')}
                >
                  <MixerVerticalIcon className="w-3 h-3 mr-3" />
                  Configurações
                </DashboardSidebarNavLink>
              </DashboardSidebarNavMain>
            </DashboardSidebarNav>

            <DashboardSidebarNav className="mt-auto">
              <DashboardSidebarNavHeader>
                <DashboardSidebarNavHeaderTitle>
                  Links extras
                </DashboardSidebarNavHeaderTitle>
              </DashboardSidebarNavHeader>
              <DashboardSidebarNavMain>
                <DashboardSidebarNavLink href="/">
                  Precisa de ajuda?
                </DashboardSidebarNavLink>
                <DashboardSidebarNavLink href="/">Site</DashboardSidebarNavLink>
              </DashboardSidebarNavMain>
            </DashboardSidebarNav>
          </DashboardSidebarMain>
          <DashboardSidebarFooter>
            <UserDropdown user={user} />
          </DashboardSidebarFooter>
        </DashboardSidebar>
      </div>

      {/* Overlay para fechar o menu ao clicar fora em dispositivos móveis */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={toggleMobileMenu}
          aria-hidden="true"
          role="presentation"
        />
      )}
    </>
  )
}

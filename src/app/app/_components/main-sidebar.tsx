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
  FileText,
  Coins,
  Lock
} from 'lucide-react'
import { UserDropdown } from './user-dropdown'
import { Logo } from '@/components/logo'
import { AuthUser } from '@/lib/auth-helper'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SubMenuItem = {
  href: string
  icon: JSX.Element
  label: string
  isPremium?: boolean
}

type MenuItem = {
  href: string
  icon: JSX.Element
  label: string
  mobileLabel: string
  isPremium?: boolean
  submenu?: SubMenuItem[]
}

type MainSidebarProps = {
  user: AuthUser
}

export function MainSidebar({ user }: MainSidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({})

  // Buscar informações completas do usuário da API
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        console.log('[MAIN-SIDEBAR] Iniciando busca de informações do usuário')
        setLoading(true)
        const response = await fetch('/api/user/info')
        if (response.ok) {
          const data = await response.json()
          console.log('[MAIN-SIDEBAR] Dados recebidos da API:', data)
          setUserInfo(data)
        } else {
          console.error('[MAIN-SIDEBAR] Erro na resposta da API:', await response.text())
        }
      } catch (error) {
        console.error('[MAIN-SIDEBAR] Erro ao buscar informações do usuário:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserInfo()
  }, [])

  // Verifica se o usuário é um afiliado sem assinatura
  const isAffiliateWithoutSub = userInfo?.isAffiliate === true && 
                                !userInfo?.stripePriceId && 
                                !userInfo?.hasActiveSubscription &&
                                !userInfo?.isIntegrationUser;

  // Verifique se o usuário pode criar templates
  const canCreateTemplates = userInfo?.canCreateTemplates === true
  console.log('[MAIN-SIDEBAR] canCreateTemplates:', canCreateTemplates)
  console.log('[MAIN-SIDEBAR] userInfo:', userInfo)

  // Lista de itens de menu básicos (sempre visíveis)
  const baseMenuItems: MenuItem[] = [
    {
      href: '/app',
      icon: <Sparkles className="w-4 h-4 mr-3" />,
      label: 'Personalize sua IA',
      mobileLabel: 'Atendente',
      isPremium: true
    },
    {
      href: '/app/dashboard',
      icon: <LayoutDashboard className="w-4 h-4 mr-3" />,
      label: 'Dashboard',
      mobileLabel: 'Dashboard',
      isPremium: true
    },
    {
      href: '/app/settings',
      icon: <Settings className="w-4 h-4 mr-3" />,
      label: 'Configurações',
      mobileLabel: 'Config.'
    }
  ]

  // Item de menu de Templates (condicional)
  const templatesMenuItem: MenuItem = {
    href: '#',
    icon: <FileText className="w-4 h-4 mr-3" />,
    label: 'Meus Modelos',
    mobileLabel: 'Modelos',
    submenu: [
      {
        href: '/app/templates',
        icon: <FileText className="w-4 h-4 mr-3" />,
        label: (
          <span className="flex items-center gap-2">
            Lista de Modelos
            <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded-full font-medium">beta</span>
          </span>
        )
      },
      {
        href: '/app/templates/affiliate',
        icon: <Coins className="w-4 h-4 mr-3" />,
        label: 'Programa de Afiliados'
      }
    ]
  }

  // Menu final com ou sem o item Templates
  const menuItems = canCreateTemplates 
    ? [...baseMenuItems.slice(0, 2), templatesMenuItem, baseMenuItems[2]] 
    : baseMenuItems

  console.log('[MAIN-SIDEBAR] Menu items:', menuItems)

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

  // Verifique se um caminho está ativo
  const isActive = (path: string) => {
    // Para o item especial com href="#" (Meus Modelos)
    if (path === '#') {
      // Retorna true se qualquer submenu estiver ativo
      return pathname.startsWith('/app/templates');
    }

    // Para todos os outros caminhos, faça uma verificação exata
    return pathname === path;
  }

  // Verificar se qualquer submenu está ativo (para destacar o item pai)
  const isSubmenuActive = (item: MenuItem) => {
    return item.submenu && item.submenu.some(sub => isActive(sub.href));
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleSubmenu = (href: string) => {
    console.log('Toggleando submenu:', href);
    setExpandedMenus(prev => {
      const newState = {
        ...prev,
        [href]: !prev[href]
      };
      console.log('Novo estado:', newState);
      return newState;
    });
  }

  // Se houver um item ativo no submenu, expanda o menu pai automaticamente
  useEffect(() => {
    if (pathname) {
      menuItems.forEach(item => {
        if (item.submenu && item.submenu.some(sub => isActive(sub.href))) {
          console.log('Expandindo menu pai automaticamente:', item.href);
          setExpandedMenus(prev => ({
            ...prev,
            [item.href]: true
          }));
        }
      });
    }
  }, [pathname]);

  // Render premium indicator if user is affiliate without subscription
  const PremiumIndicator = ({ isPremium }: { isPremium?: boolean }) => {
    if (!isAffiliateWithoutSub || !isPremium) return null;
    
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Lock className="ml-1.5 h-3 w-3 text-amber-500 opacity-80" />
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Recurso premium</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/40 z-50">
        <nav className="flex justify-around items-center h-[4.5rem] px-2">
          {menuItems.map((item) => (
            <React.Fragment key={item.href}>
              {item.submenu ? (
                <button
                  onClick={() => toggleSubmenu(item.href)}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-16 py-1 transition-all duration-200",
                    (isActive(item.href) || isSubmenuActive(item))
                      ? "text-primary scale-105"
                      : "text-muted-foreground hover:text-primary active:scale-95"
                  )}
                >
                  {React.cloneElement(item.icon, {
                    className: cn(
                      "w-6 h-6 mb-1 transition-all duration-200",
                      (isActive(item.href) || isSubmenuActive(item)) && "scale-110"
                    ),
                    strokeWidth: (isActive(item.href) || isSubmenuActive(item)) ? 2.5 : 1.5
                  })}
                  <span className="text-[11px] font-medium">
                    {item.mobileLabel}
                    {isAffiliateWithoutSub && item.isPremium && (
                      <Lock className="inline-block ml-0.5 h-2.5 w-2.5 text-amber-500" />
                    )}
                  </span>
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-16 py-1 transition-all duration-200",
                    isActive(item.href)
                      ? "text-primary scale-105"
                      : "text-muted-foreground hover:text-primary active:scale-95"
                  )}
                >
                  {React.cloneElement(item.icon, {
                    className: cn(
                      "w-6 h-6 mb-1 transition-all duration-200",
                      isActive(item.href) && "scale-110"
                    ),
                    strokeWidth: isActive(item.href) ? 2.5 : 1.5
                  })}
                  <span className="text-[11px] font-medium">
                    {item.mobileLabel}
                    {isAffiliateWithoutSub && item.isPremium && (
                      <Lock className="inline-block ml-0.5 h-2.5 w-2.5 text-amber-500" />
                    )}
                  </span>
                </Link>
              )}
            </React.Fragment>
          ))}
          <div className="flex flex-col items-center justify-center w-16 py-1">
            <UserDropdown user={user} isMobile={true} />
          </div>
        </nav>

        {/* Submenu Mobile */}
        {menuItems.map((item) => (
          item.submenu && expandedMenus[item.href] && (
            <div
              key={`submenu-${item.href}`}
              className="absolute bottom-[4.5rem] left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/40 py-3 px-4 animate-in slide-in-from-bottom duration-200"
            >
              <div className="flex justify-around">
                {item.submenu.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex flex-col items-center justify-center w-20 py-2 rounded-xl transition-all duration-200",
                      isActive(subItem.href)
                        ? "text-primary bg-primary/10 scale-105"
                        : "text-muted-foreground hover:text-primary active:scale-95"
                    )}
                    onClick={() => setExpandedMenus({})}
                  >
                    {React.cloneElement(subItem.icon, {
                      className: cn(
                        "w-6 h-6 mb-1.5 transition-all duration-200",
                        isActive(subItem.href) && "scale-110"
                      ),
                      strokeWidth: isActive(subItem.href) ? 2.5 : 1.5
                    })}
                    <span className="text-[11px] font-medium text-center px-1">
                      {subItem.label}
                      {isAffiliateWithoutSub && subItem.isPremium && (
                        <Lock className="inline-block ml-0.5 h-2.5 w-2.5 text-amber-500" />
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Ajuste para centralizar os cards no mobile e adicionar padding bottom */}
      <style jsx global>{`
        @media (max-width: 768px) {
          main > div > div {
            justify-content: center !important;
          }
          main {
            padding-bottom: 5rem !important;
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
                  <React.Fragment key={item.href}>
                    <DashboardSidebarNavLink 
                      href={item.submenu ? '#' : item.href} 
                      active={item.submenu ? isSubmenuActive(item) : isActive(item.href)}
                      onClick={item.submenu ? (e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault();
                        toggleSubmenu(item.href);
                      } : undefined}
                    >
                      {item.icon}
                      <div className="flex items-center">
                        {item.label}
                        <PremiumIndicator isPremium={item.isPremium} />
                      </div>
                      {item.submenu && (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className={`ml-auto h-4 w-4 transition-transform ${expandedMenus[item.href] ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      )}
                    </DashboardSidebarNavLink>
                    
                    {/* Renderizar submenu se existir e estiver expandido */}
                    {item.submenu && canCreateTemplates && expandedMenus[item.href] && (
                      <div className="ml-7 mt-1 mb-1 border-l-2 border-border pl-2">
                        {item.submenu.map((subItem) => (
                          <DashboardSidebarNavLink
                            key={subItem.href}
                            href={subItem.href}
                            active={isActive(subItem.href)}
                            className="py-1.5 text-xs"
                          >
                            {subItem.icon}
                            <div className="flex items-center">
                              {subItem.label}
                              <PremiumIndicator isPremium={subItem.isPremium} />
                            </div>
                          </DashboardSidebarNavLink>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
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

'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { LogOutIcon, SettingsIcon, UserCircle2, SunIcon, MoonIcon, MonitorIcon } from 'lucide-react'
import Link from 'next/link'
import { AuthUser } from '@/lib/auth-helper'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

type UserDropdownProps = {
  user: AuthUser
  isMobile?: boolean
}

export function UserDropdown({ user, isMobile = false }: UserDropdownProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      // Chamar o endpoint centralizado de logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Redirecionar para a página de login
      window.location.href = '/auth';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      
      // Fallback: tentar limpar cookies manualmente e usar signOut do NextAuth
      document.cookie = "authjs.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      await signOut({ callbackUrl: '/auth' });
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getThemeIcon = () => {
    if (!mounted) return <MonitorIcon className="mr-2 h-4 w-4" />
    
    if (theme === 'light') return <SunIcon className="mr-2 h-4 w-4" />
    if (theme === 'dark') return <MoonIcon className="mr-2 h-4 w-4" />
    return <MonitorIcon className="mr-2 h-4 w-4" />
  }

  const getThemeLabel = () => {
    if (!mounted) return 'Tema'
    
    if (theme === 'light') return 'Modo Claro'
    if (theme === 'dark') return 'Modo Escuro'
    return 'Automático'
  }

  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto p-0">
            <div className="flex flex-col items-center">
              <UserCircle2 className="w-5 h-5 mb-1" strokeWidth={1.5} />
              <span className="text-[10px]">Perfil</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              {user?.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onSelect={(event) => {
              event.preventDefault()
              toggleTheme()
            }}
            className="cursor-pointer"
          >
            {getThemeIcon()}
            {getThemeLabel()}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/settings" className="cursor-pointer">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onSelect={(event) => {
              event.preventDefault()
              handleSignOut()
            }}
            className="cursor-pointer"
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.image || ''} 
              alt={user?.name || 'User avatar'} 
            />
            <AvatarFallback>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'UN'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            {user?.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onSelect={(event) => {
            event.preventDefault()
            toggleTheme()
          }}
          className="cursor-pointer"
        >
          {getThemeIcon()}
          {getThemeLabel()}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/settings" className="cursor-pointer">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onSelect={(event) => {
            event.preventDefault()
            handleSignOut()
          }}
          className="cursor-pointer"
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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
import { LogOutIcon, SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { AuthUser } from '@/lib/auth-helper'

type UserDropdownProps = {
  user: AuthUser
}

export function UserDropdown({ user }: UserDropdownProps) {
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
        <DropdownMenuItem asChild>
          <Link href="/app/settings" className="cursor-pointer">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
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

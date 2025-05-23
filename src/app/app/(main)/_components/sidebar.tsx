import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  MessageCircle,
  Settings,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()

  const routes = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/app/dashboard',
    },
    {
      icon: MessageCircle,
      label: 'Personalize sua IA',
      href: '/app/atendente',
    },
    {
      icon: Settings,
      label: 'Configurações',
      href: '/app/configuracoes',
    },
    {
      icon: FileText,
      label: 'Templates',
      href: '/app/templates',
    },
  ]

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-secondary">
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition',
                pathname === route.href ? 'text-primary bg-primary/10' : 'text-zinc-400'
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn('h-5 w-5 mr-3')} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { signIn } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'
import { usePathname } from 'next/navigation'

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm()
  const pathname = usePathname()
  const isAffiliatePage = pathname === '/afiliados'

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setIsLoading(true)

      if (data.password !== data.confirmPassword) {
        toast({
          title: 'Erro',
          description: 'As senhas não coincidem.',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          isAffiliate: isAffiliatePage,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ocorreu um erro durante o registro.')
      }

      toast({
        title: 'Registro concluído',
        description: isAffiliatePage 
          ? 'Sua conta foi criada. Você será redirecionado para configurar sua conta de afiliado.'
          : 'Sua conta foi criada com sucesso. Agora você pode fazer login.',
      })

      // Se for afiliado e tiver link do Stripe, redirecionar para ele
      if (isAffiliatePage && result.stripeAccountLink) {
        window.location.href = result.stripeAccountLink
      } else {
        // Caso contrário, redirecionar para a página de login
        setTimeout(() => {
          window.location.href = '/auth'
        }, 2000)
      }
    } catch (error) {
      console.error('Erro de registro:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro. Por favor, tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  })

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Criar Conta</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isAffiliatePage 
            ? 'Preencha os dados abaixo para se tornar um afiliado. Você será redirecionado para configurar sua conta de pagamentos.'
            : 'Preencha os dados abaixo para criar sua conta. Você usará seu email e senha para login.'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            placeholder="Seu nome"
            required
            {...form.register('name')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="seu@email.com"
            required
            type="email"
            {...form.register('email')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            placeholder="********"
            {...form.register('password')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirme a Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            placeholder="********"
            {...form.register('confirmPassword')}
          />
        </div>
        <Button
          className="w-full"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Registrando...' : isAffiliatePage ? 'Tornar-se Afiliado' : 'Registrar'}
        </Button>
        
        <div className="text-center text-sm">
          <a href="/auth" className="text-blue-600 hover:underline">
            Já tem uma conta? Faça login
          </a>
        </div>
      </form>
    </div>
  )
} 
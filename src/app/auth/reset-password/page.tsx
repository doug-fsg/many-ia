'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/use-toast'
import { useSearchParams, useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const form = useForm()

  const token = searchParams.get('token')

  if (!token) {
    return (
      <div className="mx-auto max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Link Inválido</h1>
          <p className="text-gray-500 dark:text-gray-400">
            O link de redefinição de senha é inválido ou expirou.
          </p>
        </div>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => window.location.href = '/auth/forgot-password'}
        >
          Solicitar novo link
        </Button>
      </div>
    )
  }

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

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ocorreu um erro ao redefinir sua senha.')
      }

      toast({
        title: 'Senha redefinida',
        description: 'Sua senha foi redefinida com sucesso. Você já pode fazer login.',
      })

      // Redirecionar para a página de login após 2 segundos
      setTimeout(() => {
        router.push('/auth')
      }, 2000)
    } catch (error) {
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
        <h1 className="text-3xl font-bold">Redefinir Senha</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Digite sua nova senha abaixo.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova Senha</Label>
          <Input
            id="password"
            type="password"
            required
            placeholder="********"
            disabled={isLoading}
            {...form.register('password')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            placeholder="********"
            disabled={isLoading}
            {...form.register('confirmPassword')}
          />
        </div>
        <Button
          className="w-full"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
        </Button>
      </form>
    </div>
  )
} 
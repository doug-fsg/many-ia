'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/use-toast'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const form = useForm()

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ocorreu um erro ao processar sua solicitação.')
      }

      setEmailSent(true)
      toast({
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      })
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

  if (emailSent) {
    return (
      <div className="mx-auto max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Email Enviado</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Enviamos um email com instruções para redefinir sua senha. 
            Por favor, verifique sua caixa de entrada.
          </p>
        </div>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => window.location.href = '/auth'}
        >
          Voltar para o login
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Recuperar Senha</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Digite seu email para receber instruções de recuperação de senha.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="seu@email.com"
            required
            type="email"
            disabled={isLoading}
            {...form.register('email')}
          />
        </div>
        <Button
          className="w-full"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar instruções'}
        </Button>
        
        <div className="text-center text-sm">
          <a href="/auth" className="text-blue-600 hover:underline">
            Voltar para o login
          </a>
        </div>
      </form>
    </div>
  )
} 
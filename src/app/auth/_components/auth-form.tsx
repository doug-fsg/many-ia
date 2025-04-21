'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { signIn } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function AuthForm() {
  const [activeTab, setActiveTab] = useState<string>('credentials')

  const magicLinkForm = useForm()
  const credentialsForm = useForm()

  const handleMagicLinkSubmit = magicLinkForm.handleSubmit(async (data) => {
    try {
      await signIn('nodemailer', { email: data.email, redirect: false })

      toast({
        title: 'Link Mágico Enviado',
        description: 'Verifique seu email para o link mágico de login',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro. Por favor, tente novamente.',
      })
    }
  })

  const handleCredentialsSubmit = credentialsForm.handleSubmit(async (data) => {
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: true,
        callbackUrl: '/app'
      })

      // Redirecionamento é feito automaticamente com redirect: true
      // O código abaixo não será executado após o redirecionamento
      if (result?.error) {
        toast({
          title: 'Erro de autenticação',
          description: 'Email ou senha inválidos.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro. Por favor, tente novamente.',
        variant: 'destructive',
      })
    }
  })

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Escolha como deseja fazer login
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="credentials">Email e Senha</TabsTrigger>
          <TabsTrigger value="magic-link">Link Mágico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credentials">
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credentials-email">Email</Label>
              <Input
                id="credentials-email"
                placeholder="seu@email.com"
                required
                type="email"
                {...credentialsForm.register('email')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credentials-password">Senha</Label>
              <Input
                id="credentials-password"
                type="password"
                required
                placeholder="********"
                {...credentialsForm.register('password')}
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={credentialsForm.formState.isSubmitting}
            >
              {credentialsForm.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
            
            <div className="text-center text-sm mt-4">
              <a href="/auth/register" className="text-blue-600 hover:underline">
                Não tem uma conta? Registre-se
              </a>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="magic-link">
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
        <div className="space-y-2">
              <Label htmlFor="magic-link-email">Email</Label>
          <Input
                id="magic-link-email"
                placeholder="seu@email.com"
            required
            type="email"
                {...magicLinkForm.register('email')}
          />
        </div>
        <Button
          className="w-full"
          type="submit"
              disabled={magicLinkForm.formState.isSubmitting}
        >
              {magicLinkForm.formState.isSubmitting ? 'Enviando...' : 'Enviar Link Mágico'}
        </Button>
      </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { signIn, getCsrfToken } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchParams, useRouter } from 'next/navigation'

export function AuthForm() {
  const [activeTab, setActiveTab] = useState<string>('credentials')
  const [isLoading, setIsLoading] = useState(false)
  const [ssoError, setSsoError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Verificar parâmetros de SSO
  useEffect(() => {
    const ssoToken = searchParams.get('sso-token')
    const userId = searchParams.get('user-id')
    const callbackUrl = searchParams.get('callbackUrl') || '/app'
    
    if (ssoToken && userId) {
      setIsLoading(true)
      
      console.log('Detected SSO parameters, attempting auto-login', { ssoToken, userId })
      
      // Função para iniciar o login com proteção CSRF
      const startSsoLogin = async () => {
        try {
          // Garantir que temos cookies adequados primeiro (CSRF token)
          await fetch('/api/csrf')
          
          // Obter token CSRF do cookie diretamente para debugging
          const cookies = document.cookie.split(';')
          const csrfCookie = cookies.find(c => c.trim().startsWith('next-auth.csrf-token='))
          const csrfToken = csrfCookie ? csrfCookie.split('=')[1].split('|')[0] : null
          
          console.log('Prosseguindo com login SSO, CSRF token:', csrfToken ? 'Obtido' : 'Não encontrado')
          
          // Tente fazer login automático usando o provider sso-many
          // Usamos um pequeno atraso para garantir que os cookies estejam definidos
          setTimeout(async () => {
            try {
              // Nova chamada para garantir o token
              const officialToken = await getCsrfToken()
              console.log('Token oficial obtido:', !!officialToken)
              
              const result = await signIn('sso-many', {
                ssoToken,
                userId,
                redirect: Boolean(officialToken), // Só redireciona se tivermos o token
                callbackUrl
              }, { csrfToken: officialToken })
              
              // Se chegarmos aqui é porque redirect=false (falha ao obter token)
              console.log('Login result:', result)
              if (result?.error) {
                setSsoError(`Erro de autenticação: ${result.error}`)
                toast({
                  title: 'Falha no login',
                  description: result.error,
                  variant: 'destructive'
                })
              }
              
              setIsLoading(false)
            } catch (innerError) {
              console.error('Erro interno no login SSO:', innerError)
              setSsoError(`Erro interno: ${innerError.message || 'Desconhecido'}`)
              setIsLoading(false)
              toast({
                title: 'Erro no processo de login',
                description: innerError.message || 'Erro desconhecido',
                variant: 'destructive'
              })
            }
          }, 500)
          
        } catch (error) {
          console.error('SSO login setup failed:', error)
          setSsoError(`Falha na configuração: ${error.message || 'Desconhecido'}`)
          setIsLoading(false)
          toast({
            title: 'Falha no login automático',
            description: 'Não foi possível completar o login automático. Por favor, faça login manualmente.',
            variant: 'destructive'
          })
        }
      }
      
      startSsoLogin()
    }
  }, [searchParams])

  const magicLinkForm = useForm()
  const credentialsForm = useForm()

  const handleMagicLinkSubmit = magicLinkForm.handleSubmit(async (data) => {
    try {
      // Obter token CSRF para proteção
      const csrfToken = await getCsrfToken()
      
      await signIn('nodemailer', { 
        email: data.email, 
        redirect: false 
      }, { csrfToken })

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
      // Obter token CSRF para proteção
      const csrfToken = await getCsrfToken()
      
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: true,
        callbackUrl: '/app'
      }, { csrfToken })

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

  // Se estiver carregando, mostre um indicador de progresso
  if (isLoading) {
    return (
      <div className="mx-auto max-w-sm space-y-8 text-center">
        <h2 className="text-2xl font-bold">Autenticando...</h2>
        <p className="text-gray-500">Aguarde enquanto concluímos seu login</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Se houver um erro de SSO, mostre detalhes e opções
  if (ssoError) {
    return (
      <div className="mx-auto max-w-sm space-y-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Falha na autenticação automática</h2>
        <p className="text-gray-700">Não foi possível completar seu login automático.</p>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <p className="text-sm text-red-800">{ssoError}</p>
        </div>
        <p className="text-gray-500">Por favor, tente fazer login manualmente:</p>
        <div className="flex justify-center space-x-4 mt-4">
          <Button onClick={() => setSsoError(null)}>
            Tentar login manual
          </Button>
          <Button variant="outline" onClick={() => router.push('/app')}>
            Voltar para app
          </Button>
        </div>
      </div>
    )
  }

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

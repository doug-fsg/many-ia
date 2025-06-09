'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OnboardingRefreshPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function refreshOnboarding() {
      try {
        const response = await fetch('/api/affiliates/refresh-onboarding', {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error('Erro ao atualizar link de onboarding')
        }

        const data = await response.json()
        window.location.href = data.accountLink
      } catch (error) {
        setError('Erro ao atualizar link de onboarding. Tente novamente.')
        setIsLoading(false)
      }
    }

    refreshOnboarding()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-500">Erro</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold">Atualizando...</h1>
          <p className="text-muted-foreground">
            Estamos atualizando seu link de cadastro. Por favor, aguarde...
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 
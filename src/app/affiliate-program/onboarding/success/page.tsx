'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OnboardingSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Atualizar status do afiliado para 'active'
    fetch('/api/affiliates/activate', {
      method: 'POST',
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold">Cadastro Concluído!</h1>
          <p className="text-muted-foreground">
            Seu cadastro como afiliado foi concluído com sucesso. Você já pode
            acessar seu dashboard e começar a divulgar.
          </p>
          <Button
            onClick={() => router.push('/affiliate-program/dashboard')}
            className="w-full"
          >
            Acessar Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 
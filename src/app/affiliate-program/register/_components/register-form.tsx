'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { createAffiliateAccount } from '@/app/affiliate-program/register/actions'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function RegisterAffiliateForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function onSubmit() {
    try {
      setIsLoading(true)
      const result = await createAffiliateAccount()
      
      if (result?.accountLink) {
        router.push(result.accountLink)
      }
    } catch (error) {
      console.error('Erro ao registrar afiliado:', error)
      // Aqui você pode adicionar uma notificação de erro
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>Ao se registrar como afiliado, você concorda com:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Comissão inicial de 50% sobre todas as assinaturas indicadas</li>
          <li>Pagamentos realizados automaticamente via Stripe Connect</li>
          <li>Respeitar os termos e condições do programa de afiliados</li>
        </ul>
      </div>

      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          'Tornar-se Afiliado'
        )}
      </Button>
    </div>
  )
} 
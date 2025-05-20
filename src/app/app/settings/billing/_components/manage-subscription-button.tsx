'use client'

import { Button } from '@/components/ui/button'
import { createCustomerPortalAction } from '../actions'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function ManageSubscriptionButton() {
  const [isPending, startTransition] = useTransition()

  async function handlePortalAction(formData: FormData) {
    startTransition(async () => {
      try {
        await createCustomerPortalAction(formData)
        // Se chegou aqui, não foi redirecionado, então provavelmente ocorreu um erro
        toast.error('Erro ao acessar o portal. Recarregue a página e tente novamente.')
      } catch (error) {
        // Se for um erro de redirecionamento, deixa passar
        if (error && typeof error === 'object' && 'digest' in error && 
            typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
          // Este é um redirecionamento normal, não um erro
          console.log('Redirecionamento em andamento...')
          return;
        }

        // Se for um erro real, mostra a mensagem
        const errorMessage = error instanceof Error ? error.message : 'Erro ao acessar o portal de pagamento';
        toast.error(errorMessage)
      }
    })
  }

  return (
    <form action={handlePortalAction}>
      <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
        {isPending ? 'Carregando...' : 'Gerenciar Assinatura'}
      </Button>
    </form>
  )
} 
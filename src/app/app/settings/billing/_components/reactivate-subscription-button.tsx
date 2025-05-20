'use client'

import { Button } from '@/components/ui/button'
import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { reactivateSubscriptionAction } from '../actions'

export function ReactivateSubscriptionButton() {
  const [isPending, startTransition] = useTransition()

  async function handleReactivate() {
    startTransition(async () => {
      try {
        await reactivateSubscriptionAction()
        // Se chegou aqui, não foi redirecionado, então provavelmente ocorreu um erro
        toast.error('Erro ao reativar assinatura. Recarregue a página e tente novamente.')
      } catch (error) {
        // Se for um erro de redirecionamento, deixa passar
        if (error && typeof error === 'object' && 'digest' in error && 
            typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
          console.log('Redirecionamento em andamento...')
          return;
        }

        // Se for um erro real, mostra a mensagem
        const errorMessage = error instanceof Error ? error.message : 'Erro ao reativar assinatura';
        toast.error(errorMessage)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" className="w-full" disabled={isPending}>
          {isPending ? 'Processando...' : 'Reativar Assinatura'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reativar sua assinatura?</AlertDialogTitle>
          <AlertDialogDescription>
            Ao reativar sua assinatura, você voltará a ter acesso completo ao sistema e será cobrado mensalmente.
            Certifique-se de que todas as faturas pendentes foram pagas antes de reativar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReactivate}>
            Reativar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 
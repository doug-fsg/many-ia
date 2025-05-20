'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './dialog';

interface SubscriptionBlockedAlertProps {
  subscriptionStatus?: string | null;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  status?: string | null;
}

/**
 * Exibe uma mensagem amigável baseada no status da assinatura
 */
const getAlertMessage = (status: string | null | undefined) => {
  switch (status) {
    case 'incomplete':
      return {
        title: 'Assinatura Incompleta',
        description: 'Sua assinatura está pendente de pagamento. Por favor, complete o processo para continuar usando todas as funcionalidades.',
      };
    case 'incomplete_expired':
      return {
        title: 'Assinatura Expirada',
        description: 'Sua assinatura expirou por falta de pagamento. É necessário renová-la para continuar usando todas as funcionalidades.',
      };
    case 'canceled':
      return {
        title: 'Assinatura Cancelada',
        description: 'Sua assinatura foi cancelada. Por favor, renove sua assinatura para continuar usando todas as funcionalidades.',
      };
    case 'unpaid':
      return {
        title: 'Pagamento Pendente',
        description: 'Há um pagamento pendente em sua assinatura. Por favor, atualize suas informações de pagamento para continuar usando todas as funcionalidades.',
      };
    default:
      return {
        title: 'Verificação de Pagamento',
        description: 'É necessário atualizar suas informações de pagamento para continuar usando todas as funcionalidades.',
      };
  }
};

export function SubscriptionBlockedAlert({ 
  subscriptionStatus, 
  className, 
  open, 
  onOpenChange,
  status 
}: SubscriptionBlockedAlertProps) {
  const router = useRouter();
  const message = getAlertMessage(status || subscriptionStatus);

  // Se for usado como componente de diálogo
  if (typeof open !== 'undefined' && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {message.title}
            </DialogTitle>
            <DialogDescription>
              {message.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => {
                router.push('/app/settings/billing');
                onOpenChange(false);
              }}
              className="w-full"
            >
              Atualizar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Se for usado como componente de alerta
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{message.title}</AlertTitle>
      <AlertDescription className="flex flex-col mt-2">
        <span>{message.description}</span>
        <Button 
          onClick={() => router.push('/app/settings/billing')}
          variant="outline" 
          size="sm"
          className="mt-2 w-fit self-end"
        >
          Atualizar Pagamento
        </Button>
      </AlertDescription>
    </Alert>
  );
} 
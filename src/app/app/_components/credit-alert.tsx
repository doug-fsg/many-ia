'use client'

import { AlertTriangle, X, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

interface AlertContentProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'credits' | 'invoice';
}

function AlertContent({ isVisible, onClose, type }: AlertContentProps) {
  if (!isVisible) return null;

  const alertContent = {
    credits: {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-300" />,
      title: 'Créditos Esgotados:',
      message: 'Você atingiu o limite de créditos do mês.',
      actionText: 'Recarregar Agora',
      actionLink: '/app/settings/billing'
    },
    invoice: {
      icon: <CreditCard className="h-4 w-4 text-yellow-300" />,
      title: 'Fatura Vencida:',
      message: 'Sua fatura está pendente de pagamento.',
      actionText: 'Pagar Agora',
      actionLink: '/app/settings/billing'
    }
  }

  const content = alertContent[type]

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] shadow-lg animate-fadeIn">
      <div className="bg-gradient-to-r from-red-700 to-red-600 py-3">
        <div className="container mx-auto px-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-red-800 p-2 rounded-full">
              {content.icon}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{content.title}</span>
              <span className="text-sm opacity-95">
                {content.message}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href={content.actionLink}
              className="text-sm bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-3 py-1 rounded-md font-medium transition-colors"
            >
              {content.actionText}
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0 hover:bg-red-800/50 rounded-full flex items-center justify-center"
              onClick={onClose}
              aria-label="Fechar alerta"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CreditAlertProps {
  isOutOfCredits?: boolean;
  hasOverdueInvoice?: boolean;
}

export default function CreditAlert({ isOutOfCredits = false, hasOverdueInvoice = false }: CreditAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isOutOfCredits && !hasOverdueInvoice) return null;

  // Prioriza mostrar o alerta de fatura vencida
  const alertType = hasOverdueInvoice ? 'invoice' : 'credits';

  const handleClose = () => {
    const alert = document.querySelector('.fixed.top-0');
    if (alert) {
      alert.classList.add('animate-fadeOut');
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
  };

  return <AlertContent isVisible={isVisible} onClose={handleClose} type={alertType} />;
}
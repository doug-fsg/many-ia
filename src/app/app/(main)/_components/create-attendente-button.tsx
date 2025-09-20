'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { ConfigModeModal } from './config-mode-modal'

export function CreateAttendenteButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleOpenAdvanced = (generatedConfig?: any) => {
    if (generatedConfig) {
      // Se houver configuração gerada pelo wizard, passar como parâmetro
      console.log('[DEBUG] Enviando config para formulário:', generatedConfig)
      
      // Usar encodeURIComponent para garantir que caracteres especiais sejam preservados
      const configParam = encodeURIComponent(JSON.stringify(generatedConfig))
      
      // Construir a URL manualmente para evitar problemas com URLSearchParams
      router.push(`/app/configuracoes/nova?wizard=true&config=${configParam}`)
    } else {
      // Configuração avançada normal
      router.push('/app/configuracoes/nova')
    }
  }

  const handleButtonClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <Button
        onClick={handleButtonClick}
        className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        <Sparkles className="h-4 w-4" />
        Criar Atendente
      </Button>

      <ConfigModeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOpenAdvanced={handleOpenAdvanced}
      />
    </>
  )
}

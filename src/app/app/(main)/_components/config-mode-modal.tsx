'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Settings, ChevronRight } from 'lucide-react'
import { SmartWizard } from './smart-wizard'

interface ConfigModeModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenAdvanced: (generatedConfig?: any) => void
}

export function ConfigModeModal({ isOpen, onClose, onOpenAdvanced }: ConfigModeModalProps) {
  const [showWizard, setShowWizard] = useState(false)

  const handleSmartConfig = () => {
    setShowWizard(true)
  }

  const handleAdvancedConfig = () => {
    onClose()
    onOpenAdvanced()
  }

  const handleWizardClose = () => {
    setShowWizard(false)
    onClose()
  }

  const handleWizardComplete = (generatedConfig: any) => {
    setShowWizard(false)
    onClose()
    // Aqui vamos integrar com o formulário avançado
    onOpenAdvanced(generatedConfig)
  }

  if (showWizard) {
    return (
      <SmartWizard
        isOpen={isOpen}
        onClose={handleWizardClose}
        onComplete={handleWizardComplete}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            🚀 Como deseja criar seu atendente?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            className="w-full h-auto p-4 justify-start hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
            onClick={handleSmartConfig}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-base">Assistente Inteligente</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  Responda algumas perguntas e deixe a IA configurar para você
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto p-4 justify-start hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
            onClick={handleAdvancedConfig}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-base">Configuração Avançada</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  Configure manualmente todos os detalhes
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

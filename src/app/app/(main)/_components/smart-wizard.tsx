'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { WizardStep1 } from './wizard-steps/step1'
import { WizardStep2 } from './wizard-steps/step2'
import { WizardStep3 } from './wizard-steps/step3'
import { WizardStep4 } from './wizard-steps/step4'

interface SmartWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (config: any) => void
}

export interface WizardData {
  // Etapa 1
  ramo: string
  empresa: string
  produtos?: string
  
  // Etapa 2
  objetivo: string
  detalhesObjetivo?: string
  
  // Etapa 3
  nomeAtendente: string
  personalidade: string
  genero: string
  
  // Etapa 4
  horario: string
  mencionar?: string
}

export function SmartWizard({ isOpen, onClose, onComplete }: SmartWizardProps) {
  const { data: session } = useSession()
  const isIntegrationUser = session?.user?.isIntegrationUser ?? false
  
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<WizardData>({
    ramo: '',
    empresa: '',
    objetivo: '',
    nomeAtendente: '',
    personalidade: '',
    genero: '',
    horario: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const updateData = (newData: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...newData }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.ramo && data.empresa
      case 2: return data.objetivo
      case 3: return data.nomeAtendente && data.personalidade && data.genero
      case 4: return data.horario
      default: return false
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleFinish = async () => {
    setIsGenerating(true)
    
    try {
      // Adicionar informação sobre tipo de usuário para a IA
      const dataWithUserType = {
        ...data,
        isIntegrationUser
      }
      
      // Aqui vamos chamar a API para gerar a configuração
      const response = await fetch('/api/ai/generate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataWithUserType)
      })
      
      const generatedConfig = await response.json()
      onComplete(generatedConfig)
    } catch (error) {
      console.error('Erro ao gerar configuração:', error)
      // Por enquanto, vamos apenas fechar
      onComplete(data)
    } finally {
      setIsGenerating(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <WizardStep1 data={data} onUpdate={updateData} />
      case 2: return <WizardStep2 data={data} onUpdate={updateData} />
      case 3: return <WizardStep3 data={data} onUpdate={updateData} />
      case 4: return <WizardStep4 data={data} onUpdate={updateData} />
      default: return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="truncate">Assistente Inteligente - Etapa {currentStep} de {totalSteps}</span>
          </DialogTitle>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <div className="py-4 min-h-[300px] overflow-y-auto">
          {renderStep()}
        </div>

        <div className="flex justify-between mt-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-primary"
              size="sm"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={!canProceed() || isGenerating}
              className="bg-primary"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-1 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Criar Atendente
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

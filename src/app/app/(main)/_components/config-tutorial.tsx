'use client'

// IMPORTANTE: Este componente requer a instalação do pacote react-joyride
// Execute o comando: npm install react-joyride
// ou: yarn add react-joyride

import { useState, useEffect } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

// Definição dos passos do tutorial na ordem especificada
const createSteps = (): Step[] => [
  {
    target: '.tutorial-models',
    content: 'Escolha um modelo pré-configurado para começar mais rapidamente ou personalize do zero.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '.tutorial-nome-atendente',
    content: 'Defina o nome do seu atendente digital que será exibido aos usuários.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-horario',
    content: 'Configure o horário de atendimento para informar aos usuários quando o atendente está disponível.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-tempo-retorno',
    content: 'Define em quanto tempo a IA deve retomar o atendimento após intervenção humana.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-quem-eh',
    content: 'Descreva quem é o atendente para que a IA possa se apresentar corretamente aos usuários.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-o-que-faz',
    content: 'Explique o que seu atendente faz, quais serviços oferece e como pode ajudar os usuários.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-objetivo',
    content: 'Defina qual o objetivo principal do atendente, isso ajuda a IA a entender seu propósito e focar nas metas corretas.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-como-deve',
    content: 'Especifique como o atendente deve agir e responder às interações. Aqui você pode definir passos específicos que o atendente deve seguir em cada interação, como saudação inicial, coleta de informações, qualificação de leads, etc.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-informacoes-empresa',
    content: 'Forneça informações detalhadas sobre sua empresa, produtos ou serviços que o atendente deve conhecer para responder corretamente.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-attachments',
    content: 'Adicione arquivos (PDFs, imagens) para a IA usar como base. Na descrição, use # para criar uma referência (ex: #cardapio). Depois, use essa referência em outros campos, como: "Envie o #cardapio quando o cliente solicitar."',
    placement: 'bottom',
  },
  {
    target: '.tutorial-temas',
    content: 'Defina temas que a IA deve evitar durante as conversas com os usuários, como assuntos sensíveis ou fora do escopo.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-submit',
    content: 'Quando terminar, clique aqui para salvar suas configurações.',
    placement: 'top',
  },
]

export function ConfigTutorial() {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [tutorialShown, setTutorialShown] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])

  // Verificar elementos disponíveis e criar passos
  useEffect(() => {
    // Verificar quais elementos estão presentes no DOM
    const availableSteps = createSteps().filter(step => {
      const element = document.querySelector(step.target as string)
      return !!element
    })
    
    setSteps(availableSteps)
  }, [])

  // Verificar se o tutorial já foi mostrado antes
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('config-tutorial-shown')
    
    // Atraso para garantir que os elementos do DOM estejam carregados
    const timer = setTimeout(() => {
      setTutorialShown(true)
      
      // Só inicia automaticamente se nunca viu o tutorial
      if (!hasSeenTutorial) {
        setRun(true)
        localStorage.setItem('config-tutorial-shown', 'true')
      }
    }, 1500) // Aumentado para 1.5s para garantir que os elementos estejam carregados
    
    return () => clearTimeout(timer)
  }, [])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data
    
    // Atualiza o índice do passo atual
    if (type === 'step:after') {
      setStepIndex(index + 1)
    }
    
    // Quando o tutorial terminar ou for pulado
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false)
      setStepIndex(0)
    }
  }

  const startTutorial = () => {
    setStepIndex(0)
    setRun(true)
  }

  // Só renderiza o botão quando o tutorial já foi verificado
  if (!tutorialShown) return null

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={startTutorial}
        className="ml-2 flex items-center gap-1"
      >
        <BookOpen className="h-4 w-4" />
        <span>Ver Tutorial</span>
      </Button>

      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        run={run}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        stepIndex={stepIndex}
        disableScrolling={false}
        disableScrollParentFix={false}
        skipMissingSteps
        spotlightPadding={10}
        styles={{
          options: {
            primaryColor: '#0f172a',
            textColor: '#334155',
            backgroundColor: '#ffffff',
            arrowColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
          },
          tooltipContainer: {
            textAlign: 'left' as const,
            padding: '20px',
          },
          buttonNext: {
            backgroundColor: '#0f172a',
            color: 'white',
            fontSize: '14px',
            padding: '8px 16px',
            borderRadius: '4px',
          },
          buttonBack: {
            color: '#64748b',
            marginRight: '10px',
          },
          buttonSkip: {
            color: '#64748b',
          },
          buttonClose: {
            display: 'none',
          },
        }}
        locale={{
          back: 'Anterior',
          close: 'Fechar',
          last: 'Finalizar',
          next: 'Próximo',
          open: 'Abrir',
          skip: 'Pular',
          step: 'Passo {{current}} de {{total}}',
        }}
      />
    </>
  )
} 
'use client'

import { useState, useEffect, useMemo } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { useTheme } from 'next-themes'

const createSteps = (): Step[] => [
  {
    target: '.tutorial-models',
    content: 'Modelo rápido ou configuração manual — escolha por aqui.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '.tutorial-nome-atendente',
    content: 'Nome exibido nas conversas.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-horario',
    content: 'Disponibilidade informada ao cliente.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-tempo-retorno',
    content: 'Tempo para a IA retomar após um humano atender.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-quem-eh',
    content: 'Quem é o atendente (apresentação).',
    placement: 'bottom',
  },
  {
    target: '.tutorial-o-que-faz',
    content: 'Serviços e papel do atendente.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-objetivo',
    content: 'Meta principal (ex.: qualificar leads).',
    placement: 'bottom',
  },
  {
    target: '.tutorial-como-deve',
    content: 'Tom, passos e regras de resposta.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-informacoes-empresa',
    content: 'Dados da empresa/produto para a base de conhecimento.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-attachments',
    content: 'Arquivos de apoio. Na descrição use #referência (ex.: #cardápio) e cite nos outros campos.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-temas',
    content: 'Assuntos que a IA deve evitar.',
    placement: 'bottom',
  },
  {
    target: '.tutorial-submit',
    content: 'Salvar quando terminar.',
    placement: 'top',
  },
]

export type ConfigTutorialProps = {
  /** Se false, o tour não inicia sozinho na primeira visita (ex.: tela de edição). */
  autoStart?: boolean
}

export function ConfigTutorial({ autoStart = true }: ConfigTutorialProps) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [tutorialShown, setTutorialShown] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const { resolvedTheme } = useTheme()

  const joyrideStyles = useMemo(() => {
    const isDark = resolvedTheme === 'dark'
    const bg = isDark ? '#0f172a' : '#ffffff'
    const text = isDark ? '#e2e8f0' : '#334155'
    const subtle = isDark ? '#94a3b8' : '#64748b'
    const primary = isDark ? '#f8fafc' : '#0f172a'
    const primaryFg = isDark ? '#0f172a' : '#ffffff'
    return {
      options: {
        primaryColor: primary,
        textColor: text,
        backgroundColor: bg,
        arrowColor: bg,
        overlayColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
      },
      tooltipContainer: {
        textAlign: 'left' as const,
        padding: '16px',
      },
      buttonNext: {
        backgroundColor: primary,
        color: primaryFg,
        fontSize: '14px',
        padding: '8px 16px',
        borderRadius: '6px',
      },
      buttonBack: {
        color: subtle,
        marginRight: '10px',
      },
      buttonSkip: {
        color: subtle,
      },
      buttonClose: {
        display: 'none',
      },
    }
  }, [resolvedTheme])

  useEffect(() => {
    const availableSteps = createSteps().filter((step) => {
      const element = document.querySelector(step.target as string)
      return !!element
    })
    setSteps(availableSteps)
  }, [])

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('config-tutorial-shown')

    const timer = setTimeout(() => {
      setTutorialShown(true)
      if (autoStart && !hasSeenTutorial) {
        setRun(true)
        localStorage.setItem('config-tutorial-shown', 'true')
      }
    }, autoStart ? 1500 : 0)

    return () => clearTimeout(timer)
  }, [autoStart])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data

    if (type === 'step:after') {
      setStepIndex(index + 1)
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false)
      setStepIndex(0)
    }
  }

  const startTutorial = () => {
    setStepIndex(0)
    setRun(true)
  }

  if (!tutorialShown) return null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={startTutorial}
        className="ml-2 flex items-center gap-1"
        aria-label="Abrir tour guiado da configuração"
      >
        <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
        <span>Tour</span>
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
        styles={joyrideStyles}
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

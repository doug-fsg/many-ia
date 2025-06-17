'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

type Step = {
  number: number
  content: string
}

type StepManagerProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  className?: string
}

export function StepManager({ value, onChange, onBlur, className }: StepManagerProps) {
  const [steps, setSteps] = useState<Step[]>(() => {
    // Parse initial value into steps
    if (!value) return []

    // Primeiro, tenta encontrar passos no formato "#PASSO XX: conteudo"
    const stepRegex = /#PASSO\s+(\d+):\s*(.*?)(?=#PASSO\s+\d+:|$)/gs
    const matches = Array.from(value.matchAll(stepRegex))

    if (matches.length > 0) {
      return matches.map(match => ({
        number: parseInt(match[1], 10),
        content: match[2].trim()
      })).sort((a, b) => a.number - b.number)
    }

    // Se não encontrou no formato direto, tenta o formato com quebras de linha
    return value
      .split('\n\n')
      .filter(step => step.trim())
      .map((step, index) => {
        const [header, ...content] = step.split('\n')
        return {
          number: index + 1,
          content: content.length > 0 ? content.join('\n').trim() : header.replace(/#PASSO\s+\d+:\s*/, '').trim()
        }
      })
  })

  // Update form value when steps change
  useEffect(() => {
    const formattedSteps = steps
      .map(step => {
        const stepNumber = step.number.toString().padStart(2, '0')
        return `#PASSO ${stepNumber}:\n${step.content}`
      })
      .join('\n\n')
    onChange(formattedSteps)
  }, [steps, onChange])

  const addStep = () => {
    setSteps(currentSteps => [
      ...currentSteps,
      {
        number: currentSteps.length + 1,
        content: ''
      }
    ])
  }

  const removeStep = (index: number) => {
    setSteps(currentSteps => {
      const newSteps = currentSteps.filter((_, i) => i !== index)
      // Renumber remaining steps
      return newSteps.map((step, i) => ({
        ...step,
        number: i + 1
      }))
    })
  }

  const updateStep = (index: number, content: string) => {
    // Remove ou substitui qualquer ocorrência de #PASSO XX: do conteúdo
    const cleanContent = content.replace(/#PASSO\s+\d+:\s*/g, '')
    
    if (content !== cleanContent) {
      toast({
        title: "Aviso",
        description: "O texto '#PASSO XX:' é reservado para a numeração automática dos passos.",
      })
    }

    setSteps(currentSteps => {
      const newSteps = [...currentSteps]
      newSteps[index] = {
        ...newSteps[index],
        content: cleanContent
      }
      return newSteps
    })
  }

  // Função para ajustar a altura do textarea
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    if (textarea) {
      textarea.style.height = 'auto' // Reset para calcular a altura correta
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">Passos do Atendimento</h3>
        <Button type="button" onClick={addStep} variant="outline">
          Adicionar Passo
        </Button>
      </div>

      {steps.map((step, index) => (
        <div
          key={index}
          className="space-y-4 p-4 border rounded-lg relative"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => removeStep(index)}
          >
            &#x2715;
          </Button>

          <div>
            <h4 className="text-sm font-medium mb-2">
              PASSO {step.number.toString().padStart(2, '0')}
            </h4>
            <Textarea
              value={step.content}
              onChange={(e) => {
                updateStep(index, e.target.value)
                adjustTextareaHeight(e.target)
              }}
              onBlur={onBlur}
              placeholder="Descreva o passo..."
              className="min-h-[100px] overflow-hidden resize-none"
              ref={(textarea) => {
                if (textarea) {
                  adjustTextareaHeight(textarea)
                }
              }}
            />
          </div>
        </div>
      ))}

      {steps.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum passo adicionado. Clique em "Adicionar Passo" para começar.
        </div>
      )}
    </div>
  )
} 
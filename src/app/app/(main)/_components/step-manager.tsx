'use client'

import { useState, useEffect, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { DragHandleDots2Icon } from '@radix-ui/react-icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ShortcutField } from './shortcut-field'

interface Step {
  id: string
  numero: number
  conteudo: string
  isExpanded: boolean
}

interface Attachment {
  id: string
  type: 'image' | 'pdf'
  content: string
  description: string
}

interface StepManagerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  className?: string
  attachments: Attachment[]
}

const MAX_STEPS = 20
const MAX_CHARS = 2000

function SortableStep({ 
  step, 
  onRemove, 
  onChange, 
  onToggleExpand,
  onBlur,
  attachments 
}: {
  step: Step
  onRemove: (id: string) => void
  onChange: (id: string, content: string) => void
  onToggleExpand: (id: string) => void
  onBlur?: () => void
  attachments: Attachment[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <Collapsible
      key={step.id}
      open={step.isExpanded}
      onOpenChange={() => onToggleExpand(step.id)}
      className={cn(
        "border rounded-md p-2",
        isDragging && "opacity-50 cursor-grabbing"
      )}
      style={style}
      ref={setNodeRef}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners}>
            <DragHandleDots2Icon className="h-4 w-4 cursor-grab" />
          </div>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="font-medium">
              PASSO {String(step.numero).padStart(2, '0')}
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {step.conteudo.length}/{MAX_CHARS}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(step.id)}
            disabled={step.numero === 1}
          >
            Remover
          </Button>
        </div>
      </div>

      <CollapsibleContent className="mt-2">
        <ShortcutField
          value={step.conteudo}
          onChange={(value) => onChange(step.id, value)}
          onBlur={onBlur}
          placeholder={`Digite o conteúdo do passo ${step.numero}...`}
          className="min-h-[100px]"
          attachments={attachments}
          multiline={true}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}

export const StepManager = forwardRef<HTMLDivElement, StepManagerProps>(
  ({ value, onChange, onBlur, className, attachments }, ref) => {
  const [steps, setSteps] = useState<Step[]>(() => {
    try {
      const parsed = JSON.parse(value || '[]')
      return Array.isArray(parsed) ? parsed.map((p, idx) => ({
        id: `step-${idx}`,
        numero: idx + 1,
        conteudo: p.conteudo || '',
        isExpanded: true
      })) : [{ id: 'step-0', numero: 1, conteudo: '', isExpanded: true }]
    } catch {
      return [{ id: 'step-0', numero: 1, conteudo: '', isExpanded: true }]
    }
  })

  const [allExpanded, setAllExpanded] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const jsonValue = JSON.stringify(
      steps.map(({ numero, conteudo }) => ({ numero, conteudo }))
    )
    onChange(jsonValue)
  }, [steps, onChange])

  const handleStepChange = (id: string, newContent: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, conteudo: newContent.slice(0, MAX_CHARS) } : step
    ))
  }

  const handleAddStep = () => {
    if (steps.length >= MAX_STEPS) return
    setSteps(prev => [
      ...prev,
      {
        id: `step-${Date.now()}`,
        numero: prev.length + 1,
        conteudo: '',
        isExpanded: true
      }
    ])
  }

  const handleRemoveStep = (id: string) => {
    if (steps.length <= 1) return
    setSteps(prev => {
      const filtered = prev.filter(step => step.id !== id)
      return filtered.map((step, idx) => ({ ...step, numero: idx + 1 }))
    })
  }

  const toggleExpand = (id: string) => {
    setSteps(prev => prev.map(step =>
      step.id === id ? { ...step, isExpanded: !step.isExpanded } : step
    ))
  }

  const toggleAllExpand = () => {
    const newState = !allExpanded
    setSteps(prev => prev.map(step => ({ ...step, isExpanded: newState })))
    setAllExpanded(newState)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSteps(prev => {
      const oldIndex = prev.findIndex(step => step.id === active.id)
      const newIndex = prev.findIndex(step => step.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex)
      return reordered.map((step, idx) => ({ ...step, numero: idx + 1 }))
    })
  }

  return (
    <div className={cn('space-y-4', className)} ref={ref}>
      <div className="flex justify-between items-center">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddStep}
          disabled={steps.length >= MAX_STEPS}
        >
          Adicionar Passo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleAllExpand}
        >
          {allExpanded ? 'Contrair Todos' : 'Expandir Todos'}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {steps.map((step) => (
              <SortableStep
                key={step.id}
                step={step}
                onRemove={handleRemoveStep}
                onChange={handleStepChange}
                onToggleExpand={toggleExpand}
                onBlur={onBlur}
                attachments={attachments}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
})

StepManager.displayName = 'StepManager' 
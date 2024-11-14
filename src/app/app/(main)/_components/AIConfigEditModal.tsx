'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AIConfigUpsertDialog } from "./ai-config-upsert-dialog"
import { AIConfig } from "../types"
import { useRouter } from 'next/navigation'
import { upsertAIConfig } from '../actions'
import { toast } from '@/components/ui/use-toast'

type AIConfigEditModalProps = {
  isOpen: boolean
  onClose: () => void
  aiConfig: AIConfig | null
  onSuccess: () => void
}

export function AIConfigEditModal({ isOpen, onClose, aiConfig, onSuccess }: AIConfigEditModalProps) {
  const router = useRouter()

  const handleSubmit = async (data: AIConfig) => {
    try {
      const result = await upsertAIConfig(data)
      if (result.error) {
        throw new Error(result.error)
      }
      toast({
        title: 'Sucesso',
        description: 'Configuração de IA atualizada com sucesso.',
      })
      router.refresh()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar a configuração de IA.',
        variant: 'destructive',
      })
    }
  }

  if (!aiConfig || !isOpen) return null

  return (
    <AIConfigUpsertDialog 
      defaultValue={aiConfig} 
      onSubmit={handleSubmit}
      isEditMode={true} 
      onClose={onClose}
      isOpen={isOpen}
    />
  )
}

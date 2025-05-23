'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { ChatTest } from './ChatTest'

interface TestTemplateModalProps {
  templateId: string
  templateName: string
  trigger?: React.ReactNode
}

export function TestTemplateModal({ templateId, templateName, trigger }: TestTemplateModalProps) {
  const [open, setOpen] = useState(false)

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-1">
      <MessageSquare className="h-4 w-4" />
      Testar Modelo
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Testar Modelo: {templateName}</DialogTitle>
          <DialogDescription>
            Use este chat para testar seu modelo antes de publicá-lo.
          </DialogDescription>
        </DialogHeader>
        <ChatTest 
          agentId={templateId} 
          agentName={templateName}
          isTemplate={true}
        />
      </DialogContent>
    </Dialog>
  )
} 
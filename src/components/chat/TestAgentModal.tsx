'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { ChatTest } from './ChatTest'

interface TestAgentModalProps {
  agentId: string
  agentName: string
  accountId?: string
  inboxId?: number
  trigger?: React.ReactNode
}

export function TestAgentModal({ agentId, agentName, accountId, inboxId, trigger }: TestAgentModalProps) {
  const [open, setOpen] = useState(false)

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-1">
      <MessageSquare className="h-4 w-4" />
      Testar Agente
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Testar Agente: {agentName}</DialogTitle>
          <DialogDescription>
            Use este chat para testar seu agente antes de ativá-lo.
          </DialogDescription>
        </DialogHeader>
        <ChatTest 
          agentId={agentId} 
          agentName={agentName} 
          accountId={accountId}
          inboxId={inboxId}
        />
      </DialogContent>
    </Dialog>
  )
} 
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { ChatTest } from './ChatTest'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] max-h-[95vh] p-0 overflow-hidden">
        <div className="h-10 bg-muted/20 relative flex items-center px-4">
          <Badge variant="default" className="px-2 py-0 text-xs h-5 whitespace-nowrap">
          {agentName}
          </Badge>
          <div className="w-full flex justify-center">
            <div className="w-12 h-1 bg-muted rounded-full" />
          </div>
        </div>
        <Separator className="m-0" />
        <div className="p-2">
          <ChatTest 
            agentId={agentId} 
            agentName={agentName} 
            accountId={accountId}
            inboxId={inboxId}
            helpText="Use este chat para testar seu agente antes de ativá-lo."
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 
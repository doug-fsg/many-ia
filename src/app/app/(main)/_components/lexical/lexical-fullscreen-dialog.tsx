'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ShortcutField } from '../shortcut-field'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LexicalFullscreenDialogProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (text: string) => void
  attachments: Array<{
    type: 'image' | 'pdf'
    content: string
    description: string
  }>
}

export function LexicalFullscreenDialog({
  isOpen,
  onClose,
  value,
  onChange,
  attachments
}: LexicalFullscreenDialogProps) {
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent 
        className="w-[90vw] h-[90vh] max-w-[90vw] p-0"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
      >
        <ScrollArea className="h-full w-full">
          <div className="p-6">
            <ShortcutField
              value={value}
              onChange={onChange}
              placeholder="Digite aqui..."
              attachments={attachments}
              className="min-h-[calc(90vh-48px)] w-full resize-none focus:outline-none"
              multiline={true}
              isFullscreen={true}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 
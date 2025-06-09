'use client'

import { CopyIcon } from 'lucide-react'

export function CopyButton({ value, disabled }: { value: string; disabled?: boolean }) {
  return (
    <button 
      className={`ml-3 p-2 rounded-md ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'}`}
      onClick={() => {
        if (!disabled) {
          navigator.clipboard.writeText(value)
        }
      }}
      disabled={disabled}
    >
      <CopyIcon className="h-4 w-4" />
      <span className="sr-only">Copiar link</span>
    </button>
  )
} 
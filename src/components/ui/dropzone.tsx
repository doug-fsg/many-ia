'use client'

import * as React from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { UploadIcon } from 'lucide-react'

interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  accept?: Record<string, string[]>
  maxSize?: number
  onDrop: (acceptedFiles: File[]) => void
}

export function Dropzone({
  accept,
  maxSize,
  onDrop,
  className,
  ...props
}: DropzoneProps) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept,
    maxSize,
    onDrop,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed p-6 transition-colors',
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        isDragAccept && 'border-green-500 bg-green-50',
        isDragReject && 'border-red-500 bg-red-50',
        className
      )}
      {...props}
    >
      <input {...getInputProps()} />
      <UploadIcon className="h-10 w-10 text-muted-foreground/50" />
      <p className="mt-2 text-sm text-muted-foreground text-center">
        {isDragActive
          ? 'Solte o arquivo aqui...'
          : 'Arraste e solte arquivos aqui, ou clique para selecionar'}
      </p>
    </div>
  )
} 
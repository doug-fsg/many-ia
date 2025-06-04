// Adaptado de shadcn/ui (https://ui.shadcn.com/docs/components/toast)
import { useState, useEffect, useCallback } from 'react'

type ToastVariant = 'default' | 'destructive' | 'success'

type ToastProps = {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type Toast = ToastProps & {
  id: string
  visible: boolean
}

type ToastContextType = {
  toasts: Toast[]
  toast: (props: ToastProps) => void
  dismiss: (id: string) => void
}

// Singleton para toast global
let globalToasts: Toast[] = []
let setGlobalToasts: ((toasts: Toast[]) => void) | null = null

// Função toast diretamente exportada para compatibilidade
export const toast = (props: ToastProps) => {
  const id = Math.random().toString(36).substr(2, 9)
  
  if (setGlobalToasts) {
    // Adicionar novo toast
    setGlobalToasts([
      ...globalToasts,
      { id, ...props, visible: true },
    ])
    
    // Auto-dismiss após duration
    setTimeout(() => {
      dismissToast(id)
    }, props.duration || 5000)
  } else {
    // Fallback para quando ainda não há componente de toast renderizado
    console.log(`[Toast] ${props.variant || 'default'}: ${props.title} - ${props.description}`)
    if (process.env.NODE_ENV === 'development') {
      alert(`${props.title}\n${props.description}`)
    }
  }
}

// Função dismiss diretamente exportada para compatibilidade
export const dismissToast = (id: string) => {
  if (setGlobalToasts) {
    setGlobalToasts(
      globalToasts.map((toast) =>
        toast.id === id ? { ...toast, visible: false } : toast
      )
    )

    setTimeout(() => {
      if (setGlobalToasts) {
        setGlobalToasts(globalToasts.filter((toast) => toast.id !== id))
      }
    }, 300)
  }
}

// Implementação simplificada de toast
export function useToast(): ToastContextType {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Configurar o singleton global na primeira renderização
  useEffect(() => {
    globalToasts = toasts
    setGlobalToasts = setToasts
    
    return () => {
      if (setGlobalToasts === setToasts) {
        setGlobalToasts = null
      }
    }
  }, [toasts])

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === id ? { ...toast, visible: false } : toast
      )
    )

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, 300)
  }, [])

  const localToast = useCallback(
    ({ title, description, variant = 'default', duration = 5000 }: ToastProps) => {
      const id = Math.random().toString(36).substr(2, 9)
      
      // Adicionar novo toast
      setToasts((prevToasts) => [
        ...prevToasts,
        { id, title, description, variant, duration, visible: true },
      ])
      
      // Auto-dismiss após duration
      setTimeout(() => {
        dismiss(id)
      }, duration)
      
      // Mostrar alerta em fallback (para dev)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Toast] ${variant}: ${title} - ${description}`)
      }
    },
    [dismiss]
  )

  return {
    toasts,
    toast: localToast,
    dismiss,
  }
}

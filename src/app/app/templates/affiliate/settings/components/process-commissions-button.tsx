'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import { processPendingCommissions } from '../actions'
import { useToast } from '@/components/ui/use-toast'

export function ProcessPendingCommissionsButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleProcessCommissions = async () => {
    if (isLoading) return;
    
    setIsLoading(true)
    try {
      const result = await processPendingCommissions()
      
      if (result.success) {
        const processedCount = result.data?.processed || 0
        toast({
          title: 'Comissões processadas',
          description: `${processedCount} comissões foram processadas com sucesso.`,
          variant: 'default',
        })
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao processar comissões pendentes',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro desconhecido ao processar comissões',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleProcessCommissions} 
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Processar Comissões Pendentes
        </>
      )}
    </Button>
  )
} 
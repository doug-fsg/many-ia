'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Loader2, LinkIcon, Trash } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type WhatsAppConnection = {
  id: string
  token: string
  phoneNumber: string | null
  name: string | null
  isActive: boolean
  webhookConfigured: boolean
  createdAt: string
  updatedAt: string
}

type AIConfig = {
  id: string
  nomeAtendenteDigital: string
}

type VincularCanalProps = {
  iaId: string
  userId: string
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function VincularCanal({ iaId, userId, trigger, onSuccess }: VincularCanalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [whatsAppConnections, setWhatsAppConnections] = useState<WhatsAppConnection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [vinculatedConnections, setVinculatedConnections] = useState<string[]>([])

  // Carregar conexões WhatsApp disponíveis
  const loadConnections = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/whatsapp/connections')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar conexões')
      }
      
      const data = await response.json()
      setWhatsAppConnections(data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar conexões do WhatsApp',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar conexões já vinculadas à IA
  const loadVinculatedConnections = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/${iaId}/connections`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar conexões vinculadas')
      }
      
      const data = await response.json()
      setVinculatedConnections(data.map((conn: any) => conn.id))
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar conexões vinculadas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Configurar webhook
  const configureWebhook = async (token: string) => {
    setLoading(true)
    try {
      const response = await fetch(`http://173.249.22.227:31000/v3/bot/${token}/webhook`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://n8n.manytalks.com.br/webhook/manytalksia',
          extra: {
            id: userId,
            iaId: iaId,
            isIntegrationUser: "false"
          }
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao configurar webhook')
      }

      const data = await response.json()
      return data
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao configurar webhook',
        variant: 'destructive',
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  // Remover webhook
  const removeWebhook = async (token: string) => {
    setLoading(true)
    try {
      const response = await fetch(`http://173.249.22.227:31000/v3/bot/${token}/webhook`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao remover webhook')
      }

      return true
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao remover webhook',
        variant: 'destructive',
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Vincular um canal à IA
  const handleVincular = async () => {
    if (!selectedConnection) {
      toast({
        title: 'Aviso',
        description: 'Selecione uma conexão para vincular',
        variant: 'default',
      })
      return
    }

    try {
      setLoading(true)
      const connection = whatsAppConnections.find(conn => conn.id === selectedConnection)
      
      if (!connection) {
        throw new Error('Conexão não encontrada')
      }
      
      // Configurar webhook
      const webhookResult = await configureWebhook(connection.token)
      
      if (!webhookResult) {
        throw new Error('Falha ao configurar webhook')
      }
      
      // Registrar vinculação no banco
      const response = await fetch('/api/ai/vincular-canal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iaId,
          connectionId: selectedConnection,
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao vincular canal')
      }
      
      toast({
        title: 'Sucesso',
        description: 'Canal vinculado com sucesso',
      })
      
      setSelectedConnection(null)
      loadVinculatedConnections()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao vincular canal',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Desvincular um canal da IA
  const handleDesvincular = async (connectionId: string) => {
    try {
      setLoading(true)
      const connection = whatsAppConnections.find(conn => conn.id === connectionId)
      
      if (!connection) {
        throw new Error('Conexão não encontrada')
      }
      
      // Remover webhook
      const webhookRemoved = await removeWebhook(connection.token)
      
      if (!webhookRemoved) {
        throw new Error('Falha ao remover webhook')
      }
      
      // Remover vinculação no banco
      const response = await fetch('/api/ai/desvincular-canal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iaId,
          connectionId,
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao desvincular canal')
      }
      
      toast({
        title: 'Sucesso',
        description: 'Canal desvinculado com sucesso',
      })
      
      loadVinculatedConnections()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao desvincular canal',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadConnections()
      loadVinculatedConnections()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vincular Canal de WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="connection">Selecione uma conexão</Label>
            <Select 
              disabled={loading} 
              value={selectedConnection || undefined}
              onValueChange={setSelectedConnection}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conexão WhatsApp" />
              </SelectTrigger>
              <SelectContent>
                {whatsAppConnections
                  .filter(conn => !vinculatedConnections.includes(conn.id))
                  .map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.name || `WhatsApp (${conn.phoneNumber || 'Sem número'})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {vinculatedConnections.length > 0 && (
            <div className="mt-6 space-y-2">
              <Label>Conexões vinculadas</Label>
              <div className="space-y-2">
                {whatsAppConnections
                  .filter(conn => vinculatedConnections.includes(conn.id))
                  .map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between border p-2 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{conn.name || `WhatsApp (${conn.phoneNumber || 'Sem número'})`}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDesvincular(conn.id)}
                        disabled={loading}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={handleVincular} 
            disabled={!selectedConnection || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Processando...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" /> 
                Vincular Canal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
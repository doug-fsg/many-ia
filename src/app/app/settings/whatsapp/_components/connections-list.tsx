'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Trash2, Phone } from 'lucide-react'
import { getWhatsAppConnections, toggleWhatsAppConnection, deleteWhatsAppConnection } from '../dir'

// Definição do tipo da conexão do WhatsApp
type WhatsAppConnection = {
  id: string
  token: string
  phoneNumber: string | null
  name: string | null
  isActive: boolean
  webhookConfigured: boolean
  createdAt: string
  updatedAt: string
  iaId?: string | null
  aiConfig?: {
    id: string
    nomeAtendenteDigital: string
  } | null
}

interface WhatsAppConnectionsListProps {
  userId: string
}

// Interface que define os métodos expostos pelo ref
export interface ConnectionsListRef {
  loadConnections: () => Promise<void>
}

export const WhatsAppConnectionsList = forwardRef<ConnectionsListRef, WhatsAppConnectionsListProps>(
  ({ userId }, ref) => {
    const [connections, setConnections] = useState<WhatsAppConnection[]>([])
    const [loading, setLoading] = useState(true)
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

    // Função para carregar as conexões
    const loadConnections = async () => {
      setLoading(true);
      try {
        const response = await getWhatsAppConnections()
        if (response.data) {
          setConnections(response.data)
        } else if (response.error) {
          toast({
            title: 'Erro ao carregar conexões',
            description: response.error,
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar as conexões do WhatsApp',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    // Expor o método loadConnections através do ref
    useImperativeHandle(ref, () => ({
      loadConnections,
    }));

    // useEffect para carregar as conexões quando o componente montar
    useEffect(() => {
      loadConnections()
    }, [])

    const handleToggleConnection = async (id: string, isActive: boolean) => {
      setProcessingIds(prev => new Set(prev).add(id))
      
      try {
        const response = await toggleWhatsAppConnection(id, isActive)
        
        if (response.data) {
          setConnections(connections.map(conn => 
            conn.id === id ? { ...conn, isActive } : conn
          ))
          
          toast({
            title: 'Conexão atualizada',
            description: `A conexão foi ${isActive ? 'ativada' : 'desativada'} com sucesso.`,
          })
        } else if (response.error) {
          toast({
            title: 'Erro',
            description: response.error,
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao atualizar a conexão',
          variant: 'destructive',
        })
      } finally {
        setProcessingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    }

    const handleDeleteConnection = async (id: string) => {
      if (!confirm('Tem certeza que deseja remover esta conexão?')) return
      
      setProcessingIds(prev => new Set(prev).add(id))
      
      try {
        const response = await deleteWhatsAppConnection(id)
        
        if (response.data) {
          setConnections(connections.filter(conn => conn.id !== id))
          
          toast({
            title: 'Conexão removida',
            description: 'A conexão do WhatsApp foi removida com sucesso.',
          })
        } else if (response.error) {
          toast({
            title: 'Erro',
            description: response.error,
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao remover a conexão',
          variant: 'destructive',
        })
      } finally {
        setProcessingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Carregando conexões...</span>
        </div>
      )
    }

    if (connections.length === 0) {
      return (
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Phone className="h-12 w-12 text-muted-foreground/50" />
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Nenhuma conexão encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Você ainda não possui conexões do WhatsApp. Clique no botão acima para adicionar uma nova conexão.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Suas conexões</h4>
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{connection.name || `WhatsApp (${connection.phoneNumber || 'Não conectado'})`}</CardTitle>
                  <CardDescription className="mt-1">
                    {connection.phoneNumber 
                      ? `Número: ${connection.phoneNumber}` 
                      : 'Aguardando conexão...'
                    }
                  </CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant={connection.isActive ? "success" : "secondary"}>
                    {connection.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {connection.webhookConfigured && connection.aiConfig ? (
                    <Badge variant="outline" className="bg-primary/10">
                      IA: {connection.aiConfig.nomeAtendenteDigital}
                    </Badge>
                  ) : connection.webhookConfigured ? (
                    <Badge variant="outline">Webhook configurado</Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-sm">
                <p>Token: <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{connection.token}</span></p>
                <p className="mt-1">Criado em: {new Date(connection.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                  id={`active-${connection.id}`}
                  checked={connection.isActive}
                  disabled={processingIds.has(connection.id)}
                  onCheckedChange={(checked) => handleToggleConnection(connection.id, checked)}
                />
                <label htmlFor={`active-${connection.id}`} className="text-sm cursor-pointer">
                  {connection.isActive ? 'Ativo' : 'Inativo'}
                </label>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteConnection(connection.id)}
                disabled={processingIds.has(connection.id)}
              >
                {processingIds.has(connection.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="ml-2">Remover</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }
) 
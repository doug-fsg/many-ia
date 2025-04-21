'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Pencil2Icon,
  TrashIcon,
  MinusCircledIcon,
  PlusCircledIcon,
  ChatBubbleIcon,
} from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Command,
  CommandList,
  CommandItem,
  CommandInput,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command'
import { AIConfig } from '../types'
import {
  deleteAIConfig,
  toggleAIConfigStatus,
  getManytalksAccountId,
  updateAIConfigInbox,
} from '../actions'
import { buscarInboxes } from '@/lib/manytalks'

type AIConfigDataTable = {
  data: AIConfig[]
}

interface ManytalksInbox {
  id: number
  name: string
  channel_type: string
}

interface WhatsAppConnection {
  id: string
  token: string
  phoneNumber: string | null
  name: string | null
  isActive: boolean
  webhookConfigured: boolean
  iaId?: string | null
  createdAt: string
  updatedAt: string
}

export function AIConfigDataTable({ data }: AIConfigDataTable) {
  const router = useRouter()
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [configToDelete, setConfigToDelete] = React.useState<AIConfig | null>(
    null,
  )
  const [inboxes, setInboxes] = React.useState<ManytalksInbox[]>([])
  const [openPopoverId, setOpenPopoverId] = React.useState<string | null>(null)
  const [whatsappConnections, setWhatsappConnections] = React.useState<WhatsAppConnection[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = React.useState(false)
  const [isIntegrationUser, setIsIntegrationUser] = React.useState(false)

  const fetchInboxes = async () => {
    try {
      const accountResult = await getManytalksAccountId()
      if (accountResult.error || !accountResult.data) {
        return
      }
      const inboxesData = await buscarInboxes(accountResult.data)
      const processedInboxes = inboxesData.data.payload.map(
        (inbox: ManytalksInbox) => ({
          id: inbox.id,
          name: inbox.name,
        }),
      )
      setInboxes(processedInboxes)
    } catch (error) {
      console.error('Erro ao buscar inboxes:', error)
      toast({
        title: 'Erro ao buscar inboxes',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  const fetchWhatsAppConnections = async () => {
    setIsLoadingConnections(true)
    try {
      const response = await fetch('/api/whatsapp/connections')
      if (!response.ok) {
        throw new Error('Erro ao buscar conexões do WhatsApp')
      }
      
      const connections = await response.json()
      setWhatsappConnections(connections)
    } catch (error) {
      console.error('Erro ao buscar conexões do WhatsApp:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar conexões do WhatsApp',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingConnections(false)
    }
  }

  const handleDeleteAIConfig = async () => {
    if (!configToDelete) return

    try {
      await deleteAIConfig({ id: configToDelete.id })
      router.refresh()
      toast({
        title: 'Exclusão bem-sucedida',
        description: 'A configuração de IA foi excluída com sucesso.',
      })
      setDeleteModalOpen(false)
      setConfigToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao excluir a configuração.',
        variant: 'destructive',
      })
    }
  }

  const handleOpenDeleteModal = (aiConfig: AIConfig) => {
    setConfigToDelete(aiConfig)
    setDeleteModalOpen(true)
  }

  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setConfigToDelete(null)
  }

  const handleToggleActiveAIConfig = async (aiConfig: AIConfig) => {
    try {
      const result = await toggleAIConfigStatus(aiConfig.id, !aiConfig.isActive)

      if (result.error) {
        throw new Error(result.error)
      }

      router.refresh()

      toast({
        title: 'Atualização bem-sucedida',
        description: `Configuração ${!aiConfig.isActive ? 'ativada' : 'desativada'} com sucesso.`,
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o status.',
        variant: 'destructive',
      })
    }
  }

  const handleWhatsAppLinkClick = (e: React.MouseEvent, aiConfigId: string, connectionId: string) => {
    e.stopPropagation()
    handleWhatsAppSelect(aiConfigId, connectionId)
  }

  const handleWhatsAppSelect = async (aiConfigId: string, connectionId: string) => {
    try {
      const response = await fetch('/api/ai/vincular-canal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iaId: aiConfigId,
          connectionId: connectionId,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Erro ao vincular canal')
      }
      
      setOpenPopoverId(null)
      fetchWhatsAppConnections()
      
      toast({
        title: 'Canal vinculado',
        description: 'Canal de WhatsApp vinculado com sucesso',
      })
    } catch (error) {
      console.error('Erro ao vincular canal:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível vincular o canal',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveWhatsApp = async (connectionId: string, aiConfigId: string) => {
    try {
      const response = await fetch('/api/ai/desvincular-canal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iaId: aiConfigId,
          connectionId: connectionId,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Erro ao desvincular canal')
      }
      
      fetchWhatsAppConnections()
      
      toast({
        title: 'Canal desvinculado',
        description: 'Canal de WhatsApp desvinculado com sucesso',
      })
    } catch (error) {
      console.error('Erro ao desvincular canal:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível desvincular o canal',
        variant: 'destructive',
      })
    }
  }

  const handleInboxSelect = async (
    aiConfigId: string,
    inboxId: number,
    inboxName: string,
  ) => {
    try {
      const result = await updateAIConfigInbox(aiConfigId, inboxId, inboxName)

      if (result.error) {
        throw new Error(result.error)
      }

      router.refresh()
      setOpenPopoverId(null)

      toast({
        title: 'Canal atualizado',
        description: `Canal alterado para: ${inboxName}`,
      })
    } catch (error) {
      console.error('Erro ao atualizar canal:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o canal',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveInbox = async (aiConfig: AIConfig) => {
    try {
      const result = await updateAIConfigInbox(aiConfig.id, null, null)

      if (result.error) {
        throw new Error(result.error)
      }

      router.refresh()
      toast({
        title: 'Canal removido',
        description: 'Canal de entrada removido com sucesso',
      })
    } catch (error) {
      console.error('Erro ao remover canal:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o canal',
        variant: 'destructive',
      })
    }
  }

  React.useEffect(() => {
    fetchInboxes()
    fetchWhatsAppConnections()
  }, [])

  React.useEffect(() => {
    // Verificar se o usuário é de integração
    const checkUserType = async () => {
      try {
        // Aqui podemos verificar o tipo do usuário através de uma API ou direto do session
        // Por simplicidade, podemos usar a URL ou dados da sessão
        const response = await fetch('/api/user/info')
        const userData = await response.json()
        setIsIntegrationUser(userData.isIntegrationUser || false)
      } catch (error) {
        console.error('Erro ao verificar tipo de usuário:', error)
        setIsIntegrationUser(false) // Valor padrão em caso de erro
      }
    }
    
    checkUserType()
  }, [])

  // Função auxiliar para encontrar conexões de WhatsApp vinculadas a uma IA específica
  const getLinkedWhatsAppConnections = (aiConfigId: string) => {
    return whatsappConnections.filter(conn => conn.iaId === aiConfigId);
  }

  // Função auxiliar para encontrar conexões de WhatsApp não vinculadas a nenhuma IA
  const getAvailableWhatsAppConnections = () => {
    return whatsappConnections.filter(conn => !conn.iaId);
  }

  return (
    <>
      <div className="flex flex-wrap gap-4 p-4">
        {data.map((aiConfig) => (
          <Card
            key={aiConfig.id}
            className="relative hover:shadow-md transition-shadow w-[300px]"
          >
            <CardContent className="p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg mb-2">
                    {aiConfig.nomeAtendenteDigital}
                  </h3>
                  <Badge
                    className={`${
                      aiConfig.isActive
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    } w-20 justify-center`}
                  >
                    {aiConfig.isActive ? 'ativo' : 'inativo'}
                  </Badge>
                </div>
                <div className="border-t pt-4">
                  {/* Canal unificado - pode ser ManyTalks ou WhatsApp dependendo do tipo de usuário */}
                  <div className="flex items-center gap-2 mt-1">
                    <Popover
                      open={openPopoverId === `canal-${aiConfig.id}`}
                      onOpenChange={(open) =>
                        setOpenPopoverId(open ? `canal-${aiConfig.id}` : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs hover:bg-muted group"
                        >
                          {aiConfig.inboxName ? (
                            <span className="flex items-center gap-2 text-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              {aiConfig.inboxName}
                              <MinusCircledIcon
                                className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 ml-2 hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveInbox(aiConfig)
                                }}
                              />
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                              Vincular canal
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder={isIntegrationUser ? "Buscar canal ManyTalks..." : "Buscar conexão WhatsApp..."}
                            className="h-8 text-xs text-foreground"
                          />
                          <CommandList>
                            <CommandEmpty>
                              {isLoadingConnections 
                                ? "Carregando conexões..." 
                                : "Nenhuma conexão disponível"}
                            </CommandEmpty>
                            
                            {isIntegrationUser ? (
                              // Mostrar inboxes ManyTalks para usuários de integração
                              inboxes.map((inbox) => (
                                <CommandItem
                                  key={inbox.id}
                                  onSelect={() =>
                                    handleInboxSelect(
                                      aiConfig.id,
                                      inbox.id,
                                      inbox.name,
                                    )
                                  }
                                  className="text-xs py-1.5 text-foreground"
                                >
                                  {inbox.name}
                                </CommandItem>
                              ))
                            ) : (
                              // Mostrar conexões WhatsApp para usuários regulares
                              <>
                                {/* Conexões já vinculadas a esta IA */}
                                {getLinkedWhatsAppConnections(aiConfig.id).length > 0 && (
                                  <CommandGroup heading="Conexões vinculadas">
                                    {getLinkedWhatsAppConnections(aiConfig.id).map((conn) => (
                                      <CommandItem
                                        key={conn.id}
                                        className="text-xs py-1.5 text-foreground flex justify-between items-center"
                                      >
                                        <span>
                                          {conn.name || `WhatsApp (${conn.phoneNumber || 'Sem número'})`}
                                        </span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="h-5 w-5 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveWhatsApp(conn.id, aiConfig.id)
                                          }}
                                        >
                                          <MinusCircledIcon className="h-3.5 w-3.5 text-red-500" />
                                        </Button>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                                
                                {/* Conexões disponíveis para vincular */}
                                {getAvailableWhatsAppConnections().length > 0 && (
                                  <CommandGroup heading="Conexões disponíveis">
                                    {getAvailableWhatsAppConnections().map((conn) => (
                                      <CommandItem
                                        key={conn.id}
                                        onSelect={() => handleWhatsAppSelect(aiConfig.id, conn.id)}
                                        className="text-xs py-1.5 text-foreground"
                                      >
                                        {conn.name || `WhatsApp (${conn.phoneNumber || 'Sem número'})`}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Mostrar conexões WhatsApp já vinculadas para usuários não de integração */}
                  {!isIntegrationUser && getLinkedWhatsAppConnections(aiConfig.id).map((conn) => (
                    <div key={conn.id} className="flex items-center ml-2 mt-2 text-xs text-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                      <span className="flex-1">
                        {conn.name || `WhatsApp (${conn.phoneNumber || 'Sem número'})`}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleRemoveWhatsApp(conn.id, aiConfig.id)}
                      >
                        <MinusCircledIcon className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(`/app/configuracoes/${aiConfig.id}`)
                    }
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
                  >
                    <Pencil2Icon className="h-4 w-4" />
                    Editar
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActiveAIConfig(aiConfig)}
                    className="flex items-center gap-1 text-gray-600 hover:text-yellow-600"
                  >
                    {aiConfig.isActive ? (
                      <MinusCircledIcon className="h-4 w-4" />
                    ) : (
                      <PlusCircledIcon className="h-4 w-4" />
                    )}
                    {aiConfig.isActive ? 'Desativar' : 'Ativar'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDeleteModal(aiConfig)}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmação de Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Tem certeza que deseja excluir a configuração "
            {configToDelete?.nomeAtendenteDigital}"? Esta ação não pode ser
            desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAIConfig}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

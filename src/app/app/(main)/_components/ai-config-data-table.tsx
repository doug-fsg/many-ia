"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Pencil2Icon, TrashIcon, ChatBubbleIcon, DotsHorizontalIcon, MinusCircledIcon, CopyIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandList, CommandItem, CommandInput, CommandEmpty, CommandGroup } from "@/components/ui/command"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { AIConfig } from "../types"
import { deleteAIConfig, toggleAIConfigStatus, getManytalksAccountId, updateAIConfigInbox, upsertAIConfig } from "../actions"
import { buscarInboxes } from "@/lib/manytalks"
import { TestAgentModal } from "@/components/chat/TestAgentModal"
import { SubscriptionBlockedAlert } from "@/components/ui/subscription-blocked-alert"
import { EmptyState } from './empty-state'

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
  const [configToDelete, setConfigToDelete] = React.useState<AIConfig | null>(null)
  const [inboxes, setInboxes] = React.useState<ManytalksInbox[]>([])
  const [openPopoverId, setOpenPopoverId] = React.useState<string | null>(null)
  const [whatsappConnections, setWhatsappConnections] = React.useState<WhatsAppConnection[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = React.useState(false)
  const [isIntegrationUser, setIsIntegrationUser] = React.useState(false)
  const [hoveredCardId, setHoveredCardId] = React.useState<string | null>(null)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = React.useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<string | null>(null)
  const [showEmptyState, setShowEmptyState] = React.useState(false)

  const fetchInboxes = async () => {
    try {
      const accountResult = await getManytalksAccountId()
      if (accountResult.error || !accountResult.data) {
        // Silenciosamente retornar sem mostrar erro para o usuário
        console.warn("Não foi possível obter o ID da conta ManyTalks")
        return
      }
      
      try {
        const inboxesData = await buscarInboxes(accountResult.data)
        if (inboxesData && inboxesData.data && inboxesData.data.payload) {
          const processedInboxes = inboxesData.data.payload.map((inbox: ManytalksInbox) => ({
            id: inbox.id,
            name: inbox.name,
          }))
          setInboxes(processedInboxes)
        } else {
          // Se não houver dados, apenas definir como array vazio
          setInboxes([])
          console.warn("Nenhum inbox encontrado para esta conta")
        }
      } catch (inboxError) {
        // Silenciosamente logger o erro sem mostrar para o usuário
        console.warn("Erro ao buscar inboxes:", inboxError)
        setInboxes([])
      }
    } catch (error) {
      // Silenciosamente logger o erro sem mostrar para o usuário
      console.warn("Erro ao buscar ID da conta:", error)
    }
  }

  const fetchWhatsAppConnections = async () => {
    setIsLoadingConnections(true)
    try {
      const response = await fetch("/api/whatsapp/connections")
      
      if (response.ok) {
        const connections = await response.json()
        setWhatsappConnections(connections)
      } else if (response.status === 401) {
        // Apenas logamos o erro de autenticação, sem mostrar toast
        console.warn("Usuário não autenticado para buscar conexões do WhatsApp")
      } else {
        // Apenas log em caso de erro real, sem exibir toast para o usuário
        console.error("Erro ao buscar conexões do WhatsApp:", response.statusText)
      }
    } catch (error) {
      // Apenas log em caso de erro, sem exibir toast para o usuário
      console.error("Erro ao buscar conexões do WhatsApp:", error)
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
        title: "Exclusão bem-sucedida",
        description: "A configuração de IA foi excluída com sucesso.",
      })
      setDeleteModalOpen(false)
      setConfigToDelete(null)
    } catch (error) {
      console.error("Erro ao excluir:", error)
      toast({
        title: "Erro",
        description: "Falha ao excluir a configuração.",
        variant: "destructive",
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
      const result = await toggleAIConfigStatus(aiConfig.id!, !aiConfig.isActive)

      if (result.error) {
        if (result.paymentRequired) {
          // Se for erro de pagamento, abre o modal de pagamento
          setSubscriptionModalOpen(true);
          setSubscriptionStatus(result.subscriptionStatus);
          return;
        }
        throw new Error(result.error)
      }

      router.refresh()

      toast({
        title: "Atualização bem-sucedida",
        description: `Configuração ${!aiConfig.isActive ? "ativada" : "desativada"} com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Falha ao atualizar o status.",
        variant: "destructive",
      })
    }
  }

  const handleWhatsAppLinkClick = (e: React.MouseEvent, aiConfigId: string, connectionId: string) => {
    e.stopPropagation()
    handleWhatsAppSelect(aiConfigId, connectionId)
  }

  const handleWhatsAppSelect = async (aiConfigId: string, connectionId: string) => {
    try {
      const response = await fetch("/api/ai/vincular-canal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          iaId: aiConfigId,
          connectionId: connectionId,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao vincular canal")
      }

      setOpenPopoverId(null)
      fetchWhatsAppConnections()

      toast({
        title: "Canal vinculado",
        description: "Canal de WhatsApp vinculado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao vincular canal:", error)
      toast({
        title: "Erro",
        description: "Não foi possível vincular o canal",
        variant: "destructive",
      })
    }
  }

  const handleRemoveWhatsApp = async (connectionId: string, aiConfigId: string) => {
    try {
      const response = await fetch("/api/ai/desvincular-canal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          iaId: aiConfigId,
          connectionId: connectionId,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao desvincular canal")
      }

      fetchWhatsAppConnections()

      toast({
        title: "Canal desvinculado",
        description: "Canal de WhatsApp desvinculado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao desvincular canal:", error)
      toast({
        title: "Erro",
        description: "Não foi possível desvincular o canal",
        variant: "destructive",
      })
    }
  }

  const handleInboxSelect = async (aiConfigId: string, inboxId: number, inboxName: string) => {
    try {
      const result = await updateAIConfigInbox(aiConfigId, inboxId, inboxName)

      if (result.error) {
        throw new Error(result.error)
      }

      router.refresh()
      setOpenPopoverId(null)

      toast({
        title: "Canal atualizado",
        description: `Canal alterado para: ${inboxName}`,
      })
    } catch (error) {
      console.error("Erro ao atualizar canal:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o canal",
        variant: "destructive",
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
        title: "Canal removido",
        description: "Canal de entrada removido com sucesso",
      })
    } catch (error) {
      console.error("Erro ao remover canal:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o canal",
        variant: "destructive",
      })
    }
  }

  const handleDuplicate = async (aiConfig: AIConfig) => {
    try {
      // Remove o ID para criar uma nova configuração
      const { id, ...configToDuplicate } = aiConfig as any
      
      // Adiciona "(Cópia)" ao nome
      configToDuplicate.nomeAtendenteDigital = `${configToDuplicate.nomeAtendenteDigital} (Cópia)`
      
      // Cria a nova configuração
      // @ts-ignore – ignorar verificação estrita do schema neste contexto de duplicação
      const result = await upsertAIConfig(configToDuplicate as any)
      
      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Sucesso',
        description: 'Configuração duplicada com sucesso.',
      })

      router.refresh()
    } catch (error) {
      console.error('Erro ao duplicar configuração:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao duplicar a configuração.',
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
        const response = await fetch("/api/user/info")
        if (response.ok) {
          const userData = await response.json()
          setIsIntegrationUser(userData.isIntegrationUser || false)
          // Só ativa o EmptyState se NÃO for usuário de integração
          if (!userData.isIntegrationUser) {
            setShowEmptyState(true)
          }
        } else {
          // Em caso de erro, assume que não é usuário de integração
          setIsIntegrationUser(false)
          setShowEmptyState(true)
          console.warn("Não foi possível verificar o tipo de usuário, assumindo usuário regular")
        }
      } catch (error) {
        // Em caso de erro, assume que não é usuário de integração
        console.warn("Erro ao verificar tipo de usuário, assumindo usuário regular:", error)
        setIsIntegrationUser(false)
        setShowEmptyState(true)
      }
    }

    checkUserType()
  }, [])

  // Função auxiliar para encontrar conexões de WhatsApp vinculadas a uma IA específica
  const getLinkedWhatsAppConnections = (aiConfigId: string) => {
    return whatsappConnections.filter((conn) => conn.iaId === aiConfigId)
  }

  // Função auxiliar para encontrar conexões de WhatsApp não vinculadas a nenhuma IA
  const getAvailableWhatsAppConnections = () => {
    return whatsappConnections.filter((conn) => !conn.iaId)
  }

  // Função para determinar se deve mostrar o EmptyState
  const shouldShowEmptyState = () => {
    // Não mostra EmptyState para usuários de integração
    if (isIntegrationUser) return false;
    
    if (!showEmptyState) return false;

    // Caso 1: Não tem nenhuma configuração
    if (data.length === 0) return true;

    // Caso 2: Tem configuração mas não tem WhatsApp
    if (data.length > 0 && whatsappConnections.length === 0) return true;

    return false;
  }

  return (
    <>
      {shouldShowEmptyState() ? (
        <EmptyState 
          hasConfigs={data.length > 0}
          hasWhatsApp={whatsappConnections.length > 0}
          onDismiss={() => setShowEmptyState(false)}
        />
      ) : (
        <div className="flex flex-wrap gap-4 p-4">
          {data.map((aiConfig) => (
            <Card
              key={aiConfig.id}
              className={`relative hover:shadow-md transition-all duration-200 w-[300px] ${
                aiConfig.isActive ? 'bg-green-100/10' : ''
              }`}
              onMouseEnter={() => setHoveredCardId(aiConfig.id || null)}
              onMouseLeave={() => setHoveredCardId(null)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">
                      {aiConfig.nomeAtendenteDigital}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{aiConfig.isActive ? 'Ativo' : 'Inativo'}</span>
                      <Switch 
                        checked={aiConfig.isActive} 
                        onCheckedChange={() => handleToggleActiveAIConfig(aiConfig)}
                        className={aiConfig.isActive ? 'bg-green-500' : ''}
                      />

                      {/* Menu de contexto com ações */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`text-muted-foreground hover:text-foreground transition-opacity duration-200 ${
                              hoveredCardId === aiConfig.id ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            <DotsHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => router.push(`/app/configuracoes/${aiConfig.id!}`)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDuplicate(aiConfig)}>
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onSelect={() => handleOpenDeleteModal(aiConfig)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    {/* Canal unificado - pode ser ManyTalks ou WhatsApp dependendo do tipo de usuário */}
                    <div className="flex items-center gap-2 mt-1">
                      <Popover
                        open={openPopoverId === `canal-${aiConfig.id}`}
                        onOpenChange={(open) => setOpenPopoverId(open ? `canal-${aiConfig.id}` : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs hover:bg-muted group">
                            {aiConfig.inboxName || getLinkedWhatsAppConnections(aiConfig.id).length > 0 ? (
                              <span className="flex items-center gap-2 text-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {aiConfig.inboxName || `${getLinkedWhatsAppConnections(aiConfig.id)[0]?.name || 'WhatsApp'}`}
                                <MinusCircledIcon
                                  className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 ml-2 hover:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (aiConfig.inboxName) {
                                      handleRemoveInbox(aiConfig)
                                    } else {
                                      const firstConnection = getLinkedWhatsAppConnections(aiConfig.id)[0]
                                      if (firstConnection) {
                                        handleRemoveWhatsApp(firstConnection.id, aiConfig.id)
                                      }
                                    }
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
                                {isLoadingConnections ? (
                                  "Carregando conexões..."
                                ) : (
                                  <div className="py-2 px-1 text-center">
                                    <p className="text-xs text-muted-foreground mb-2">Nenhuma conexão disponível</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Você pode adicionar conexões na página de configurações do WhatsApp
                                    </p>
                                  </div>
                                )}
                              </CommandEmpty>

                              {isIntegrationUser ? (
                                // Mostrar inboxes ManyTalks para usuários de integração
                                inboxes.map((inbox) => (
                                  <CommandItem
                                    key={inbox.id}
                                    onSelect={() => handleInboxSelect(aiConfig.id, inbox.id, inbox.name)}
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
                                          <span>{conn.name || `WhatsApp (${conn.phoneNumber || "Sem número"})`}</span>
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
                                          {conn.name || `WhatsApp (${conn.phoneNumber || "Sem número"})`}
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
                    {!isIntegrationUser && getLinkedWhatsAppConnections(aiConfig.id).length > 0 && (
                      <div className="mt-2">
                        {getLinkedWhatsAppConnections(aiConfig.id).map((conn, index) => (
                          index === 0 ? null : (
                            <div key={conn.id} className="flex items-center ml-2 mt-2 text-xs text-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                              <span className="flex-1">{conn.name || `WhatsApp (${conn.phoneNumber || "Sem número"})`}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => handleRemoveWhatsApp(conn.id, aiConfig.id)}
                              >
                                <MinusCircledIcon className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons at the bottom */}
                  <div className="flex gap-2 mt-4 justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/app/configuracoes/${aiConfig.id || ''}`)
                      }
                      className={`flex-1 flex items-center justify-center gap-1 text-gray-600 hover:text-blue-600 hover:bg-blue-100/70 transition-all duration-200 border border-gray-200 ${
                        hoveredCardId === aiConfig.id ? 'opacity-100 scale-105 shadow-sm' : 'opacity-75'
                      }`}
                    >
                      <Pencil2Icon className="h-4 w-4" />
                      Editar
                    </Button>

                    <TestAgentModal 
                      agentId={aiConfig.id || ''}
                      agentName={aiConfig.nomeAtendenteDigital || ''}
                      accountId={(aiConfig as any).userId as string || ''}
                      inboxId={(aiConfig as any).inboxId as string | undefined}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex-1 flex items-center justify-center gap-1 text-gray-600 hover:text-purple-600 hover:bg-purple-100 relative transition-all duration-200 border border-gray-200 ${
                            hoveredCardId === aiConfig.id ? 'opacity-100 scale-105 shadow-sm' : 'opacity-75'
                          }`}
                        >
                          <ChatBubbleIcon className="h-4 w-4" />
                          <span>Testar</span>
                        </Button>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmação de Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Tem certeza que deseja excluir a configuração "{configToDelete?.nomeAtendenteDigital}"? Esta ação não pode
            ser desfeita.
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

      <SubscriptionBlockedAlert
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
        status={subscriptionStatus}
      />
    </>
  )
}

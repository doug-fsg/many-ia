// src/components/AIConfigForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { AIConfig, Template } from '../types'
import { upsertAIConfig } from '../actions'
import { upsertAIConfigSchema, AIConfigFormData } from '../schema'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ExpandIcon,
  Check,
  ChevronsUpDown,
  PlusIcon,
  MoreHorizontal,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Pencil,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { StepManager } from './step-manager'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import { LibraryAttachments } from './library-attachments'
import { ShortcutTextarea } from './shortcut-textarea'
import { ShortcutInput } from './shortcut-input'
import { EnhancedTextarea } from './enhanced-textarea'
import { EnhancedInput } from './enhanced-input'
import { ShortcutField } from './shortcut-field'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from '@/components/ui/badge'
import { LexicalFullscreenDialog } from './lexical/lexical-fullscreen-dialog'
import { GoogleCalendarConfigDialog } from './integrations/google-calendar-config-dialog'
import { useGoogleCalendarAccess } from '@/hooks/use-feature-flags'

type AIConfigFormProps = {
  defaultValue?: AIConfig
  onSuccess?: () => void
  isEditMode?: boolean
  initialData?: AIConfig
}

// Adicione a interface para TemasEvitar
interface TemasEvitar {
  tema: string
}

// Corrigir o tipo Attachment para remover o tipo 'link'
type Attachment = {
  id: string
  type: 'image' | 'pdf' | 'audio' | 'video'
  content: string
  description: string
}

export function AIConfigForm({
  defaultValue,
  onSuccess,
  isEditMode = false,
}: AIConfigFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isIntegrationUser = session?.user?.isIntegrationUser ?? false
  const [expandedField, setExpandedField] = useState<string | null>(null)
  const [expandedContent, setExpandedContent] = useState('')
  const [novoTema, setNovoTema] = useState('')
  const [temasEvitar, setTemasEvitar] = useState<string[]>(() => {
    if (defaultValue?.temasEvitar) {
      return defaultValue.temasEvitar.map((tema: any) => typeof tema === 'string' ? tema : tema.tema)
    }
    return []
  })
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [open, setOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isCustomized, setIsCustomized] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [templateOptions, setTemplateOptions] = useState<Array<{
    value: string
    label: string
    description: string
    template: any
  }>>([])
  const [isEssentialInfoOpen, setIsEssentialInfoOpen] = useState(true)
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false)
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false)
  const [isGoogleCalendarOpen, setIsGoogleCalendarOpen] = useState(false)
  const [googleCalendarDialogDefaults, setGoogleCalendarDialogDefaults] =
    useState<AIConfigFormData | null>(null)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  // Adicionar um estado para forçar a atualização do StepManager
  const [stepManagerKey, setStepManagerKey] = useState(0)
  const { hasAccess: hasGoogleCalendarAccess } = useGoogleCalendarAccess()

  const form = useForm<AIConfigFormData>({
    resolver: zodResolver(upsertAIConfigSchema),
    defaultValues: {
      isActive: defaultValue?.isActive ?? false,
      detectarIdioma: defaultValue?.detectarIdioma ?? false,
      enviarParaAtendente: defaultValue?.enviarParaAtendente ?? true,
      nomeAtendenteDigital: defaultValue?.nomeAtendenteDigital ?? '',
      quemEhAtendente: defaultValue?.quemEhAtendente ?? '',
      oQueAtendenteFaz: defaultValue?.oQueAtendenteFaz ?? '',
      objetivoAtendente: defaultValue?.objetivoAtendente ?? '',
      comoAtendenteDeve: defaultValue?.comoAtendenteDeve ?? '',
      horarioAtendimento: defaultValue?.horarioAtendimento ?? 'Atender 24h por dia',
      tempoRetornoAtendimento: defaultValue?.tempoRetornoAtendimento ?? 'Não retornar automaticamente',
      condicoesAtendimento: defaultValue?.condicoesAtendimento ?? '',
      informacoesEmpresa: defaultValue?.informacoesEmpresa ?? '',
      temasEvitar: defaultValue?.temasEvitar?.map((tema: any) => typeof tema === 'string' ? tema : tema.tema) ?? [],
      attachments: defaultValue?.attachments?.map(att => ({
        id: att.id || `attachment-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        type: att.type as 'image' | 'pdf' | 'audio' | 'video',
        content: att.content,
        description: att.description
      })) ?? [],
      inboxId: defaultValue?.inboxId,
      inboxName: defaultValue?.inboxName,
      // Campos para Google Calendar
      googleCalendarEnabled: defaultValue?.googleCalendarEnabled ?? false,
      calendarId: defaultValue?.calendarId ?? '',
      defaultEventDuration: defaultValue?.defaultEventDuration ?? 60,
      weeklySchedule: defaultValue?.weeklySchedule ?? null,
      minAdvanceTime: defaultValue?.minAdvanceTime ?? 1,
      maxAdvanceTime: defaultValue?.maxAdvanceTime ?? 30,
      defaultReminder: defaultValue?.defaultReminder ?? null,
      reminderMessage: defaultValue?.reminderMessage ?? '',
      autoCreateEvents: defaultValue?.autoCreateEvents ?? false,
      eventType: defaultValue?.eventType ?? 'video_call',
      responsibleEmails: defaultValue?.responsibleEmails ?? [],
      aiPrompt: defaultValue?.aiPrompt ?? '',
      enableScarcityMode: defaultValue?.enableScarcityMode ?? false,
      maxSlotsToShow: defaultValue?.maxSlotsToShow ?? 5,
      agendas: defaultValue?.agendas ?? undefined,
    },
  })

  const openGoogleCalendarDialog = useCallback(() => {
    setGoogleCalendarDialogDefaults(form.getValues())
    setIsGoogleCalendarOpen(true)
  }, [form])

  const closeGoogleCalendarDialog = useCallback(() => {
    setIsGoogleCalendarOpen(false)
  }, [])

  // Não é mais necessário formatar o valor do comoAtendenteDeve pois o StepManager já lida com isso

  // Processar defaultValue e atualizar o formulário
  useEffect(() => {
    // Atualizar o formulário quando defaultValue mudar
    if (defaultValue) {
      
      // Verificar se os dados vieram do wizard (IA)
      const isFromWizard = defaultValue.nomeAtendenteDigital && 
                          defaultValue.quemEhAtendente && 
                          defaultValue.oQueAtendenteFaz
      
      form.reset({
        isActive: defaultValue.isActive ?? true,
        detectarIdioma: defaultValue.detectarIdioma ?? false,
        enviarParaAtendente: defaultValue.enviarParaAtendente ?? true,
        nomeAtendenteDigital: defaultValue.nomeAtendenteDigital ?? '',
        quemEhAtendente: defaultValue.quemEhAtendente ?? '',
        oQueAtendenteFaz: defaultValue.oQueAtendenteFaz ?? '',
        objetivoAtendente: defaultValue.objetivoAtendente ?? '',
        comoAtendenteDeve: defaultValue.comoAtendenteDeve ?? '',
        informacoesEmpresa: defaultValue.informacoesEmpresa ?? '',
        horarioAtendimento: defaultValue.horarioAtendimento ?? 'Atender 24h por dia',
        temasEvitar: defaultValue.temasEvitar ?? [],
        condicoesAtendimento: defaultValue.condicoesAtendimento ?? '',
        tempoRetornoAtendimento: defaultValue.tempoRetornoAtendimento ?? '',
        // Campos para Google Calendar
        googleCalendarEnabled: defaultValue.googleCalendarEnabled ?? false,
        calendarId: defaultValue.calendarId ?? '',
        defaultEventDuration: defaultValue.defaultEventDuration ?? 60,
        weeklySchedule: defaultValue.weeklySchedule ?? null,
        minAdvanceTime: defaultValue.minAdvanceTime ?? 1,
        maxAdvanceTime: defaultValue.maxAdvanceTime ?? 30,
        defaultReminder: defaultValue.defaultReminder ?? null,
        reminderMessage: defaultValue.reminderMessage ?? '',
        autoCreateEvents: defaultValue.autoCreateEvents ?? false,
        eventType: defaultValue.eventType ?? 'video_call',
        responsibleEmails: defaultValue.responsibleEmails ?? [],
        aiPrompt: defaultValue.aiPrompt ?? '',
        enableScarcityMode: defaultValue.enableScarcityMode ?? false,
        maxSlotsToShow: defaultValue.maxSlotsToShow ?? 5,
        agendas: defaultValue.agendas ?? undefined,
      })

      // 🎉 Confete quando a IA preencher o formulário!
      // Só mostrar confetes se vier do wizard E não estiver em modo de edição
      if (isFromWizard && !isEditMode) {
        setTimeout(() => {
          // 🌈 Explosão principal - CENTRO com muitas cores
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: [
              '#9c6fff', '#8b5cf6', '#7c3aed', // Roxos principais
              '#f0ebff', '#e4d9ff', '#d8c7ff', // Roxos claros
              '#ff6b9d', '#ff8cc8', '#ffb3d9', // Rosas vibrantes
              '#4ecdc4', '#45b7aa', '#26a69a', // Verdes água
              '#ffd93d', '#ffcc02', '#ffb300', // Amarelos dourados
              '#ff6b6b', '#ff5252', '#e53935', // Vermelhos
              '#42a5f5', '#2196f3', '#1976d2', // Azuis
              '#ab47bc', '#9c27b0', '#8e24aa'  // Roxos escuros
            ],
            scalar: 1.4,
            drift: 0.5,
            gravity: 1.2,
            ticks: 120
          })
          
          // 💥 Explosão das LATERAIS - ESQUERDA
          setTimeout(() => {
            confetti({
              particleCount: 100,
              angle: 45,
              spread: 70,
              origin: { x: 0, y: 0.8 },
              colors: [
                '#ff6b9d', '#ff8cc8', '#ffb3d9',
                '#9c6fff', '#8b5cf6', '#7c3aed',
                '#ffd93d', '#ffcc02', '#ffb300',
                '#4ecdc4', '#45b7aa', '#26a69a'
              ],
              scalar: 1.3,
              drift: 0.3,
              gravity: 1.2,
              ticks: 100
            })
          }, 80)
          
          // 💥 Explosão das LATERAIS - DIREITA
          setTimeout(() => {
            confetti({
              particleCount: 100,
              angle: 135,
              spread: 70,
              origin: { x: 1, y: 0.8 },
              colors: [
                '#42a5f5', '#2196f3', '#1976d2',
                '#9c6fff', '#8b5cf6', '#7c3aed',
                '#ff6b6b', '#ff5252', '#e53935',
                '#ab47bc', '#9c27b0', '#8e24aa'
              ],
              scalar: 1.3,
              drift: -0.3,
              gravity: 1.2,
              ticks: 100
            })
          }, 100)
          
          // 🎊 Explosão SUPERIOR - CHUVA DE CONFETES
          setTimeout(() => {
            confetti({
              particleCount: 200,
              spread: 90,
              origin: { y: 0.2 },
              colors: [
                '#9c6fff', '#8b5cf6', '#7c3aed',
                '#ff6b9d', '#ff8cc8', '#ffb3d9',
                '#4ecdc4', '#45b7aa', '#26a69a',
                '#ffd93d', '#ffcc02', '#ffb300',
                '#ff6b6b', '#ff5252', '#e53935',
                '#42a5f5', '#2196f3', '#1976d2'
              ],
              scalar: 1.2,
              drift: 0,
              gravity: 1.5,
              ticks: 150
            })
          }, 150)
          
          // 🌟 Explosão FINAL - FOGOS DE ARTIFÍCIO
          setTimeout(() => {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.4 },
              colors: [
                '#ffd700', '#ffed4e', '#fff176', // Dourados
                '#9c6fff', '#8b5cf6', '#7c3aed', // Roxos
                '#ff6b9d', '#ff8cc8', '#ffb3d9', // Rosas
                '#4ecdc4', '#45b7aa', '#26a69a'  // Verdes
              ],
              scalar: 1.8,
              drift: 0,
              gravity: 0.8,
              ticks: 150
            })
          }, 300)
          
        }, 500) // Delay para garantir que a página carregou
      }
    }
    
    // Processar anexos se existirem
    if (defaultValue?.attachments && defaultValue.attachments.length > 0) {
      const filteredAttachments = defaultValue.attachments
        .map(att => ({
          id: att.id || `attachment-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          type: att.type as 'image' | 'pdf' | 'audio' | 'video',
          content: att.content,
          description: att.description
        }));
      setAttachments(filteredAttachments);
    }
  }, [defaultValue, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (selectedTemplate && type === 'change') {
        const template = templateOptions.find(t => t.value === selectedTemplate)?.template
        if (!template) return

        const currentValues = form.getValues()
        const isDifferent = Object.keys(template).some((key) => {
          if (key === 'id' || key === 'status') return false
          return template[key as keyof typeof template] !== currentValues[key as keyof typeof currentValues]
        })

        setIsCustomized(isDifferent)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, selectedTemplate, templateOptions])

  // Carregar templates do banco
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates')
        if (!response.ok) {
          throw new Error('Falha ao carregar templates')
        }
        const templates = await response.json()
        // Transformar os templates no formato correto
        const formattedTemplates = templates.map((template: any) => ({
          value: template.id,
          label: template.name,
          description: template.quemEhAtendente,
          template: template
        }))
        setTemplateOptions(formattedTemplates)
      } catch (error) {
        console.error('Erro ao carregar templates:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os templates.',
          variant: 'destructive',
        })
      }
    }

    fetchTemplates()
  }, [])

  const adicionarTema = () => {
    if (novoTema.trim()) {
      if (!temasEvitar.includes(novoTema.trim())) {
        setTemasEvitar([...temasEvitar, novoTema.trim()])
        setNovoTema('')
      } else {
        toast({
          title: 'Tema já existe',
          description: 'Este tema já foi adicionado à lista.',
          variant: 'destructive',
        })
      }
    }
  }

  const removerTema = (index: number) => {
    const novosTemas = temasEvitar.filter((_, i) => i !== index)
    setTemasEvitar(novosTemas)
  }

  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error(
          `Falha ao fazer upload do arquivo: ${response.status} ${response.statusText}`,
        )
      }
      const data = await response.json()
      if (!data.fileId) {
        throw new Error('URL do arquivo não recebida do servidor')
      }
      return data.fileId
    } catch (error) {
      console.error('Erro durante o upload:', error)
      throw error
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const templateData = templateOptions.find(t => t.value === templateId)?.template
    
    if (!templateData) {
      console.error('Template não encontrado:', templateId)
      return
    }

    // Lista de campos que devem ser copiados do template
    const allowedFields = [
      'nomeAtendenteDigital',
      'enviarParaAtendente',
      'quemEhAtendente',
      'oQueAtendenteFaz',
      'objetivoAtendente',
      // 'comoAtendenteDeve', // Removido da lista geral para tratamento especial
      'horarioAtendimento',
      'tempoRetornoAtendimento',
      'condicoesAtendimento',
      'informacoesEmpresa'
    ]

    // Atualizar os campos do formulário com os dados do template
    allowedFields.forEach(field => {
      if (templateData[field] !== undefined) {
        form.setValue(field, templateData[field], {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        })
      }
    })

    // Tratamento especial para o campo comoAtendenteDeve
    if (templateData.comoAtendenteDeve !== undefined) {
      try {
        // Definir o valor no formulário
        form.setValue('comoAtendenteDeve', templateData.comoAtendenteDeve, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        
        // Forçar o rerender do componente StepManager incrementando a key
        setStepManagerKey(prev => prev + 1);
      } catch (e) {
        console.error('Erro ao processar comoAtendenteDeve:', e);
      }
    }

    setSelectedTemplate(templateId)
    setIsCustomized(false)
  }

  const handleExpandField = (fieldName: string) => {
    setExpandedField(fieldName)
    setExpandedContent(form.getValues(fieldName))
    setIsDialogOpen(true)
  }

  const handleCloseExpanded = () => {
    if (expandedField && expandedContent) {
      form.setValue(expandedField, expandedContent, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
    }
    setExpandedField(null)
    setExpandedContent('')
    setIsDialogOpen(false)
  }

  const addAttachment = () => {
    // Gerar um ID verdadeiramente único com timestamp e número aleatório
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    const newId = `attachment-${timestamp}-${random}`;
    
    const newAttachment: Attachment = {
      id: newId,
      type: 'image',
      content: '',
      description: '#',
    }
    setAttachments(prev => [...prev, newAttachment])
  }

  const updateAttachment = (
    index: number,
    field: keyof Attachment,
    value: string,
  ) => {
    const newAttachments = [...attachments]
    newAttachments[index] = {
      ...newAttachments[index],
      [field]: value
    }
    setAttachments(newAttachments)
  }

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments]
    newAttachments.splice(index, 1)
    setAttachments(newAttachments)
  }

  const persistConfig = async (data: AIConfigFormData) => {
    setIsSavingConfig(true)
    toast({
      title: 'Salvando…',
    })
    try {
      const simpleData = {
        ...data,
        attachments,
        temasEvitar: temasEvitar.map((tema) => ({ tema })),
        id: isEditMode && defaultValue ? defaultValue.id : undefined,
      }
      const result = await upsertAIConfig(simpleData)
      if (result?.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Salvo',
        })
        router.refresh()
        onSuccess?.()
      }
    } catch (error) {
      console.error('Erro na submissão:', error)
        toast({
          title: 'Não foi possível salvar',
          variant: 'destructive',
        })
    } finally {
      setIsSavingConfig(false)
    }
  }

  const onSubmit = async (data: AIConfigFormData) => {
    await persistConfig(data)
  }

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-6">
        <Form {...form}>
          <form
            id="ai-config-form"
            onSubmit={form.handleSubmit(onSubmit, () => {
              toast({
                title: 'Há campos inválidos',
                variant: 'destructive',
              })
            })}
            className="space-y-8"
          >
            <div className="space-y-6">
              <div className="group flex items-center justify-between bg-card/50 hover:bg-card rounded-lg p-4 border transition-all duration-200 tutorial-models">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">Modelos</h2>
                  <span
                    className="flex items-center"
                    title={
                      !selectedTemplate
                        ? 'Nenhum modelo'
                        : isCustomized
                          ? 'Personalizado'
                          : 'Modelo aplicado'
                    }
                  >
                    {!selectedTemplate ? (
                      <CircleDashed className="h-4 w-4 text-amber-500" aria-hidden />
                    ) : isCustomized ? (
                      <Pencil className="h-4 w-4 text-orange-500" aria-hidden />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
                    )}
                    <span className="sr-only">
                      {!selectedTemplate
                        ? 'Nenhum modelo selecionado'
                        : isCustomized
                          ? 'Configuração personalizada em relação ao modelo'
                          : 'Modelo base aplicado'}
                    </span>
                  </span>
                </div>

                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-[250px] justify-between group-hover:border-primary/20 group-hover:bg-background transition-colors duration-200"
                    >
                      <div className="flex items-center gap-2">
                        {selectedTemplate ? (
                          <>
                            {isCustomized
                              ? 'Personalizado'
                              : templateOptions.find(
                                  (template) =>
                                    template.value === selectedTemplate,
                                )?.label}
                          </>
                        ) : (
                          'Selecione um modelo...'
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="end">
                    <Command>
                      <CommandInput
                        placeholder="Buscar modelo..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum template encontrado.</CommandEmpty>
                        <CommandGroup>
                          {templateOptions.map((template) => (
                            <CommandItem
                              key={template.value}
                              value={template.value}
                              onSelect={() => {
                                handleTemplateSelect(template.value)
                                setOpen(false)
                              }}
                              className="flex flex-col items-start py-3 px-4 cursor-pointer hover:bg-accent/50"
                            >
                              <div className="flex w-full items-center gap-2">
                                <div className="flex-1">
                                  <span className="font-medium flex items-center gap-2">
                                    {template.label}
                                    {selectedTemplate === template.value &&
                                      (isCustomized ? (
                                        <Pencil className="h-3.5 w-3.5 text-orange-500" aria-hidden />
                                      ) : (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" aria-hidden />
                                      ))}
                                  </span>
                                  <p className="text-sm text-muted-foreground">
                                    {template.description}
                                  </p>
                                </div>
                                {selectedTemplate === template.value && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="mx-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  ou
                </span>
                <div className="flex-grow border-t border-border"></div>
              </div>

      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Ativo</FormLabel>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nomeAtendenteDigital"
        render={({ field }) => (
          <FormItem className="tutorial-nome-atendente">
            <FormLabel className="ai-config-label">Nome do Atendente Digital</FormLabel>
            <FormControl>
              <Input
                placeholder="Digite o nome do atendente digital"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="horarioAtendimento"
        render={({ field }) => (
          <FormItem className="tutorial-horario">
            <FormLabel>Horário de Atendimento</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário de atendimento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Atender 24h por dia">
                  Atender 24h por dia
                </SelectItem>
                <SelectItem value="Fora do horário de atendimento">
                  Fora do horário de atendimento
                </SelectItem>
                <SelectItem value="Dentro do horário de atendimento">
                  Dentro do horário de atendimento
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isIntegrationUser && (
        <FormField
          control={form.control}
          name="tempoRetornoAtendimento"
          render={({ field }) => (
            <FormItem className="tutorial-tempo-retorno">
              <FormLabel>Retornar o atendimento em</FormLabel>
              <Select 
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tempo para retorno automático" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Não retornar automaticamente">
                    Não retornar automaticamente
                  </SelectItem>
                  <SelectItem value="300000">
                    5 minutos
                  </SelectItem>
                  <SelectItem value="1800000">
                    30 minutos
                  </SelectItem>
                  <SelectItem value="3600000">
                    1 hora
                  </SelectItem>
                  <SelectItem value="10800000">
                    3 horas
                  </SelectItem>
                  <SelectItem value="28800000">
                    8 horas
                  </SelectItem>
                  <SelectItem value="43200000">
                    12 horas
                  </SelectItem>
                  <SelectItem value="86400000">
                    24 horas
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {isIntegrationUser && (
        <FormField
          control={form.control}
          name="enviarParaAtendente"
          render={({ field }) => (
            <FormItem className="flex flex-col rounded-lg border p-4">
              <div className="flex flex-row items-center justify-between">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Enviar para Atendente
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </div>
              {field.value && (
                <FormField
                  control={form.control}
                  name="condicoesAtendimento"
                  render={({ field: condicoesField }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Condições de Atendimento</FormLabel>
                      <FormControl>
                        <ShortcutField
                          {...condicoesField}
                          attachments={attachments}
                          placeholder="Separe as condições por vírgula"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </FormItem>
          )}
        />
      )}

              <Collapsible
                open={isEssentialInfoOpen}
                onOpenChange={setIsEssentialInfoOpen}
                className="space-y-4 rounded-lg border p-4 tutorial-essential">
                <CollapsibleTrigger asChild>
                  <div className="flex justify-between items-center p-4 cursor-pointer border-b border-transparent group-hover:border-border">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight">Informações essenciais</h2>
                      <ChevronsUpDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:text-foreground" />
                    </div>
                    <span
                      className="flex items-center"
                      title={form.watch('quemEhAtendente') ? 'Preenchido' : 'Pendente'}
                    >
                      {form.watch('quemEhAtendente') ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
                      ) : (
                        <CircleDashed className="h-4 w-4 text-amber-500" aria-hidden />
                      )}
                      <span className="sr-only">
                        {form.watch('quemEhAtendente')
                          ? 'Primeiro bloco obrigatório preenchido'
                          : 'Aguardando descrição de quem é o atendente'}
                      </span>
                    </span>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-6 p-4 pt-2">
        <div className="relative">
          <FormField
            control={form.control}
            name="quemEhAtendente"
            render={({ field }) => (
              <FormItem className="tutorial-quem-eh mb-8">
                <div className="flex justify-between items-center">
                  <FormLabel className="ai-config-label">Quem é seu Atendente?</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExpandField('quemEhAtendente')}
                    aria-label="Abrir editor expandido: quem é o atendente"
                  >
                    <ExpandIcon className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <FormControl>
                  <ShortcutField
                    {...field}
                    attachments={attachments}
                    placeholder="Ex: Clara é uma atendente digital especializada em vendas..."
                    className="h-36 shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                    multiline={true}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="relative">
          <FormField
            control={form.control}
            name="oQueAtendenteFaz"
            render={({ field }) => (
              <FormItem className="tutorial-o-que-faz mb-8">
                <div className="flex justify-between items-center">
                  <FormLabel className="ai-config-label">O que seu Atendente faz?</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExpandField('oQueAtendenteFaz')}
                    aria-label="Abrir editor expandido: o que o atendente faz"
                  >
                    <ExpandIcon className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <FormControl>
                  <ShortcutField
                    {...field}
                    attachments={attachments}
                    placeholder="Ex: Realiza atendimento ao cliente, qualifica leads..."
                    className="h-36 shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                    multiline={true}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="relative">
          <FormField
            control={form.control}
            name="objetivoAtendente"
            render={({ field }) => (
              <FormItem className="tutorial-objetivo mb-8">
                <div className="flex justify-between items-center">
                  <FormLabel className="ai-config-label">Qual o objetivo do seu Atendente?</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExpandField('objetivoAtendente')}
                    aria-label="Abrir editor expandido: objetivo do atendente"
                  >
                    <ExpandIcon className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <FormControl>
                  <ShortcutField
                    {...field}
                    attachments={attachments}
                    placeholder="O objetivo principal é qualificar leads..."
                    className="h-36 shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                    multiline={true}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="relative">
          <FormField
            control={form.control}
            name="comoAtendenteDeve"
            render={({ field }) => (
              <FormItem className="tutorial-como-deve mb-8">
                <div className="flex justify-between items-center">
                  <FormLabel className="ai-config-label">Como seu Atendente deve responder?</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExpandField('comoAtendenteDeve')}
                    aria-label="Abrir editor expandido: como o atendente deve responder"
                  >
                    <ExpandIcon className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <FormControl>
                  <StepManager
                    key={stepManagerKey} // Adicionar a key para forçar o rerender
                    value={field.value}
                    onChange={field.onChange}
                    attachments={attachments}
                    className="shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

                  <div className="relative">
        <FormField
          control={form.control}
          name="informacoesEmpresa"
          render={({ field }) => (
            <FormItem className="tutorial-informacoes-empresa mb-8">
              <div className="flex justify-between items-center">
                            <FormLabel className="ai-config-label">Informações sobre a Empresa/Produto/Serviço</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleExpandField('informacoesEmpresa')}
                  aria-label="Abrir editor expandido: informações da empresa"
                >
                  <ExpandIcon className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              <FormControl>
                <ShortcutField
                  {...field}
                  attachments={attachments}
                              placeholder="Descreva informações importantes sobre sua empresa..."
                  className="h-36 shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                  multiline={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="rounded-lg border p-4 tutorial-attachments">
                <CollapsibleTrigger className="group w-full">
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight">Anexos</h2>
                      <Badge variant={attachments.length > 0 ? "success" : "secondary"} className="ml-2">
                        {attachments.length} {attachments.length === 1 ? 'anexo' : 'anexos'}
                      </Badge>
                      <ChevronsUpDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:text-foreground" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <LibraryAttachments
                    attachments={attachments}
                    onUpdate={updateAttachment}
                    onRemove={removeAttachment}
                    onAdd={addAttachment}
                  />
                </CollapsibleContent>
              </Collapsible>

              {hasGoogleCalendarAccess && (
                <Collapsible id="secao-integracoes" className="rounded-lg border p-4 scroll-mt-24">
                  <CollapsibleTrigger asChild>
                    <div className="group flex w-full cursor-pointer items-center justify-between rounded-md transition-colors duration-200 hover:bg-muted/40">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold tracking-tight">Integrações</h2>
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-foreground" />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4">
                    <div className="flex flex-col gap-4 rounded-lg border border-border/80 bg-card/50 p-4 transition-colors duration-200 hover:bg-card sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Calendar className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="flex flex-wrap items-center gap-2 font-medium">
                            Google Calendar
                            {(form.watch('googleCalendarEnabled') ||
                              (Array.isArray(form.watch('agendas')) && (form.watch('agendas')?.length ?? 0) > 0)) && (
                              <Badge className="bg-primary text-primary-foreground text-xs font-medium">Ativo</Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {form.watch('googleCalendarEnabled') ||
                            (Array.isArray(form.watch('agendas')) && (form.watch('agendas')?.length ?? 0) > 0)
                              ? 'Sincronizado'
                              : 'Opcional'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 transition-colors duration-200"
                        onClick={openGoogleCalendarDialog}
                        aria-label="Abrir configuração do Google Calendar"
                      >
                        Configurar
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <Collapsible
                open={isMoreOptionsOpen}
                onOpenChange={setIsMoreOptionsOpen}
                className="space-y-4 rounded-lg border p-4">
                <CollapsibleTrigger asChild>
                  <div className="flex justify-between items-center p-4 cursor-pointer border-b border-transparent group-hover:border-border">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight">Mais opções</h2>
                      <ChevronsUpDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:text-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      {temasEvitar.length > 0 ? (
                        <Badge
                          variant="default"
                          className="min-w-8 justify-center font-normal tabular-nums"
                          title={`${temasEvitar.length} tema(s) bloqueado(s)`}
                        >
                          <span className="sr-only">Temas bloqueados: </span>
                          {temasEvitar.length}
                        </Badge>
                      ) : (
                        <span title="Nenhum tema bloqueado">
                          <CircleDashed className="h-4 w-4 text-muted-foreground" aria-hidden />
                          <span className="sr-only">Nenhum tema bloqueado</span>
                        </span>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="p-4 pt-2 space-y-6">
                  <FormField
                    control={form.control}
                    name="detectarIdioma"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mb-6">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Detectar idioma</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="tutorial-temas space-y-3">
                    <h3 className="text-sm font-medium">Temas a evitar</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite um tema a evitar"
                        value={novoTema}
                        onChange={(e) => setNovoTema(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            adicionarTema()
                          }
                        }}
                      />
                      <Button type="button" onClick={adicionarTema} size="sm" variant="outline">
                        Adicionar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {temasEvitar.map((tema, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1"
                        >
                          <span>{tema}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                            onClick={() => removerTema(index)}
                            aria-label={`Remover tema: ${tema}`}
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
                </div>

            <div className="sticky bottom-0 z-10 -mx-6 mt-8 flex flex-col gap-4 border-t bg-background/95 px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-muted-foreground" title="Recomendado validar respostas antes de uso em produção">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                <span>Teste antes de ativar.</span>
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingConfig}
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="tutorial-submit"
                  disabled={isSavingConfig}
                >
                  {isSavingConfig ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {expandedField && (
          <LexicalFullscreenDialog
            isOpen={isDialogOpen}
            onClose={handleCloseExpanded}
            value={expandedContent}
            onChange={setExpandedContent}
            attachments={attachments}
          />
        )}

        <GoogleCalendarConfigDialog
          isOpen={isGoogleCalendarOpen}
          onClose={closeGoogleCalendarDialog}
          defaultValues={googleCalendarDialogDefaults ?? undefined}
          onSuccess={(data) => {
            Object.keys(data).forEach(key => {
              if (data[key] !== undefined) {
                form.setValue(key as any, data[key]);
              }
            });
          }}
        />
      </CardContent>
    </Card>
  )
}

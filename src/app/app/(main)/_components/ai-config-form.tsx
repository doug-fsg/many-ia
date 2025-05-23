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
  FormDescription,
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
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExpandIcon, Check, ChevronsUpDown } from 'lucide-react'
import { useSession } from 'next-auth/react'

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

type Attachment = {
  type: 'link' | 'image' | 'pdf'
  content: string // URL para links ou fileId para arquivos
  description: string
}

type AIConfigFormProps = {
  defaultValue?: AIConfig
  onSuccess?: () => void
  isEditMode?: boolean
  initialData?: AIConfig
}

// Adicione a interface para TemasEvitar
interface TemasEvitar {
  id: string
  tema: string
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
      return defaultValue.temasEvitar.map((tema: TemasEvitar) => tema.tema)
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

  const form = useForm<AIConfigFormData>({
    resolver: zodResolver(upsertAIConfigSchema),
    defaultValues: defaultValue || {
      isActive: false,
      enviarParaAtendente: true,
      quemEhAtendente: '',
      oQueAtendenteFaz: '',
      objetivoAtendente: '',
      comoAtendenteDeve: '',
      horarioAtendimento: 'Atender 24h por dia',
      tempoRetornoAtendimento: 'Não retornar automaticamente',
      condicoesAtendimento: '',
      informacoesEmpresa: '',
    },
  })

  useEffect(() => {
    if (defaultValue?.attachments && defaultValue.attachments.length > 0) {
      setAttachments(defaultValue.attachments)
    }
  }, [defaultValue])

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (selectedTemplate && type === 'change') {
        const template = templateOptions.find(t => t.value === selectedTemplate)?.template
        if (!template) return

        const currentValues = form.getValues()
        const isDifferent = Object.keys(template).some((key) => {
          if (key === 'id' || key === 'status') return false
          return template[key as keyof Template] !== currentValues[key as keyof typeof currentValues]
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

  const handleExpandField = (fieldName: string) => {
    const currentValue = form.getValues(fieldName) as string
    setExpandedContent(currentValue)
    setExpandedField(fieldName)
    setIsDialogOpen(true)
  }

  const handleCloseExpanded = () => {
    if (expandedField) {
      form.setValue(expandedField, expandedContent, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
    setIsDialogOpen(false)
    setTimeout(() => {
      setExpandedField(null)
      setExpandedContent('')
    }, 200)
  }

  const addAttachment = () => {
    setAttachments([
      ...attachments,
      { type: 'link', content: '', description: '' },
    ])
  }

  const updateAttachment = (
    index: number,
    field: keyof Attachment,
    value: string,
  ) => {
    const updatedAttachments = [...attachments]
    if (field === 'type') {
      updatedAttachments[index] = {
        type: value as 'link' | 'image' | 'pdf',
        content: '',
        description: '',
      }
    } else {
      updatedAttachments[index][field] = value
    }
    setAttachments(updatedAttachments)
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
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
      'comoAtendenteDeve',
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

    setSelectedTemplate(templateId)
    setIsCustomized(false)
  }

  const formContent = (
    <>
      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Ativo</FormLabel>
              <FormDescription>
                Ative ou desative esta configuração de IA.
              </FormDescription>
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
          <FormItem>
            <FormLabel>Nome do Atendente Digital</FormLabel>
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
          <FormItem>
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
            <FormItem>
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
              <FormDescription>
                Define em quanto tempo a IA deve retomar o atendimento após intervenção humana
              </FormDescription>
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
                  <FormDescription>
                    Defina se o atendimento deve ser enviado para o atendente.
                  </FormDescription>
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
                        <Input
                          placeholder="Separe as condições por vírgula"
                          {...condicoesField}
                          onChange={(e) => {
                            condicoesField.onChange(e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Ex: Quando houver problema técnico, Quando houver
                        reclamação
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </FormItem>
          )}
        />
      )}

      <div className="space-y-6 border rounded-lg p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Informações Essenciais</h2>
        </div>

        <div className="relative">
          <FormField
            control={form.control}
            name="quemEhAtendente"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Quem é o seu Atendente?</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExpandField('quemEhAtendente')}
                    className="h-8 w-8 p-0"
                  >
                    <ExpandIcon className="h-4 w-4" />
                  </Button>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Você é um Sales Development Representative (SDR)..."
                    className="h-36"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="relative">
          <FormField
            control={form.control}
            name="oQueAtendenteFaz"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>O que seu Atendente faz?</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExpandField('oQueAtendenteFaz')}
                    className="h-8 w-8 p-0"
                  >
                    <ExpandIcon className="h-4 w-4" />
                  </Button>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Sua principal missão é gerar um fluxo constante..."
                    className="h-36"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="relative">
          <FormField
            control={form.control}
            name="objetivoAtendente"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Qual o objetivo do seu Atendente?</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExpandField('objetivoAtendente')}
                    className="h-8 w-8 p-0"
                  >
                    <ExpandIcon className="h-4 w-4" />
                  </Button>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Seu objetivo é atrair o interesse dos leads, construir..."
                    className="h-36"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="relative">
          <FormField
            control={form.control}
            name="comoAtendenteDeve"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Como seu Atendente deve responder?</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExpandField('comoAtendenteDeve')}
                    className="h-8 w-8 p-0"
                  >
                    <ExpandIcon className="h-4 w-4" />
                  </Button>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Seu tom de comunicação deve ser..."
                    className="h-36"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-6 border rounded-lg p-6">
        <FormField
          control={form.control}
          name="informacoesEmpresa"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>
                  Informações sobre a Empresa/Produto/Serviço
                </FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExpandField('informacoesEmpresa')}
                  className="h-8 w-8 p-0"
                >
                  <ExpandIcon className="h-4 w-4" />
                </Button>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Nossa empresa oferece serviços de consultoria financeira para pequenas e médias empresas, oferecemos um sistema de controle financeiro, integrado com análise de métricas em tempo real..."
                  className="h-36"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormItem className="flex flex-col rounded-lg border p-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <FormLabel className="text-base">Anexos para IA</FormLabel>
          <Button type="button" onClick={addAttachment} variant="outline">
            Adicionar Anexo
          </Button>
        </div>
        {attachments.map((attachment, index) => (
          <div
            key={index}
            className="space-y-4 mt-4 p-4 border rounded-lg relative"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => removeAttachment(index)}
            >
              &#x2715;
            </Button>

            <FormItem>
              <FormLabel>Tipo de Anexo</FormLabel>
              <Select
                value={attachment.type}
                onValueChange={(value) =>
                  updateAttachment(index, 'type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            {attachment.type === 'link' ? (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <Input
                  placeholder="https://exemplo.com"
                  value={attachment.content}
                  onChange={(e) =>
                    updateAttachment(index, 'content', e.target.value)
                  }
                />
              </FormItem>
            ) : (
              <FormItem>
                <FormLabel>
                  {attachment.type === 'image' ? 'Imagem' : 'PDF'}
                </FormLabel>
                {attachment.type === 'image' ? (
                  <FormItem>
                    {attachment.content ? (
                      <div className="flex items-center space-x-4 bg-secondary/50 p-3 rounded-lg border">
                        <div className="relative w-20 h-20 rounded-md overflow-hidden shadow-sm">
                          <img 
                            src={`/api/files/${attachment.content}`} 
                            alt="Uploaded" 
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-black/10 hover:bg-black/20 transition-colors"></div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium truncate">
                            {attachment.content}
                          </p>
                          <div className="flex space-x-2">
                            <Button 
                              type="button" 
                              variant="outline"
                              size="sm"
                              className="hover:bg-primary/10"
                              onClick={() => window.open(`/api/files/${attachment.content}`, '_blank')}
                            >
                              Visualizar
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => updateAttachment(index, 'content', '')}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Input
                        type="file"
                        accept="image/*"
                        className="cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-primary/20 border-input"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const fileId = await handleFileUpload(file)
                              updateAttachment(index, 'content', fileId)
                            } catch (error) {
                              console.error('Erro no upload:', error)
                              toast({
                                title: 'Erro de Upload',
                                description: 'Não foi possível fazer upload da imagem.',
                                variant: 'destructive'
                              })
                            }
                          }
                        }}
                      />
                    )}
                  </FormItem>
                ) : (
                  <FormItem>
                   
                    <Input
                      type="file"
                      accept=".pdf"
                      className="cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-primary/20 border-input"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          try {
                            const fileId = await handleFileUpload(file)
                            updateAttachment(index, 'content', fileId)
                          } catch (error) {
                            console.error('Erro no upload:', error)
                            toast({
                              title: 'Erro de Upload',
                              description: 'Não foi possível fazer upload do PDF.',
                              variant: 'destructive'
                            })
                          }
                        }
                      }}
                    />
                  </FormItem>
                )}
              </FormItem>
            )}

            <FormItem>
              <FormLabel>Gatilho</FormLabel>
              <Input
                placeholder="Descreva o anexo"
                value={attachment.description}
                onChange={(e) =>
                  updateAttachment(index, 'description', e.target.value)
                }
              />
            </FormItem>
          </div>
        ))}
      </FormItem>

      <FormItem className="flex flex-col rounded-lg border p-4 space-y-2">
        <FormLabel className="text-base">
          Quais temas ele deve evitar?
        </FormLabel>
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
          <Button type="button" onClick={adicionarTema}>
            Adicionar
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
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
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                onClick={() => removerTema(index)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
        <FormDescription>
          Digite um tema e pressione Enter ou clique em Adicionar. Os temas
          aparecerão como tags abaixo.
        </FormDescription>
      </FormItem>
    </>
  )

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = form.getValues()
              const temasFormatados = temasEvitar.map((tema) => ({ tema }))

              upsertAIConfig({
                ...formData,
                attachments,
                temasEvitar: temasFormatados,
                id: isEditMode && defaultValue ? defaultValue.id : undefined,
              })
                .then((result) => {
                  if (result.error) {
                    toast({
                      title: 'Erro',
                      description: result.error,
                      variant: 'destructive',
                    })
                  } else {
                    toast({
                      title: 'Sucesso',
                      description: 'Configuração salva com sucesso.',
                    })
                    router.refresh()
                    if (onSuccess) onSuccess()
                  }
                })
                .catch((error) => {
                  console.error('Erro ao salvar:', error)
                  toast({
                    title: 'Erro',
                    description: 'Falha ao salvar a configuração.',
                    variant: 'destructive',
                  })
                })
            }}
            className="space-y-8"
          >
            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">Modelos</h2>
                  <p className="text-sm text-muted-foreground">
                    Comece com um modelo pré-configurado ou personalize do zero.
                  </p>
                </div>

                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-[250px] justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {selectedTemplate ? (
                          <>
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                isCustomized ? 'bg-orange-500' : 'bg-primary',
                              )}
                            />
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
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                              className="flex flex-col items-start py-3 px-4 cursor-pointer"
                            >
                              <div className="flex w-full items-center gap-2">
                                <div
                                  className={cn(
                                    'w-2 h-2 rounded-full',
                                    selectedTemplate === template.value
                                      ? isCustomized
                                        ? 'bg-orange-500'
                                        : 'bg-primary'
                                      : 'bg-muted',
                                  )}
                                />
                                <span className="font-medium">
                                  {template.label}
                                  {selectedTemplate === template.value &&
                                    isCustomized && (
                                      <span className="ml-2 text-sm text-orange-500">
                                        (Personalizado)
                                      </span>
                                    )}
                                </span>
                                <Check
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    selectedTemplate === template.value
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground ml-4 mt-1">
                                {template.description}
                              </span>
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
                <p className="mx-4 text-sm text-muted-foreground">
                  ou configure manualmente
                </p>
                <div className="flex-grow border-t border-border"></div>
              </div>
            </div>
            {formContent}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Salvando...'
                  : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && handleCloseExpanded()}
      >
        <DialogContent className="w-screen h-screen max-w-none m-0 p-6 rounded-none">
          <DialogHeader>
            <DialogTitle>
              {expandedField === 'quemEhAtendente' && 'Quem é o seu Atendente?'}
              {expandedField === 'oQueAtendenteFaz' &&
                'O que seu Atendente faz?'}
              {expandedField === 'objetivoAtendente' &&
                'Qual o objetivo do seu Atendente?'}
              {expandedField === 'comoAtendenteDeve' &&
                'Como seu Atendente deve responder?'}
              {expandedField === 'informacoesEmpresa' &&
                'Informações sobre a Empresa/Produto/Serviço'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(100vh-120px)]">
            <Textarea
              value={expandedContent}
              onChange={(e) => setExpandedContent(e.target.value)}
              className="w-full h-full resize-none p-4 focus:outline-none"
              placeholder="Digite seu texto aqui..."
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

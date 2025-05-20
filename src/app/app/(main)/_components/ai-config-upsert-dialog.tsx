'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { AIConfig } from '../types'
import { upsertAIConfig } from '../actions'
import { zodResolver } from '@hookform/resolvers/zod'
import { upsertAIConfigSchema } from '../schema'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import * as z from 'zod'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type AIConfigUpsertDialogProps = {
  children?: React.ReactNode
  defaultValue?: AIConfig
  onSuccess?: () => void
  isEditMode?: boolean
  isOpen?: boolean
  onClose?: () => void
  onSubmit?: (data: AIConfig) => Promise<void>
}

type PaymentLink = {
  url: string
  objective: string
}

export function AIConfigUpsertDialog({
  children,
  defaultValue,
  onSuccess,
  isEditMode = false,
  onClose,
  isOpen,
  onSubmit,
}: AIConfigUpsertDialogProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isIntegrationUser = session?.user?.isIntegrationUser ?? false
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])

  const form = useForm({
    resolver: zodResolver(upsertAIConfigSchema),
    defaultValues: defaultValue || {
      isActive: false,
      nomeAtendenteDigital: '',
      enviarParaAtendente: true,
      cargoUsuario: '',
      instrucoesAtendenteVirtual: '',
      horarioAtendimento: 'Atender 24h por dia',
      tempoRetornoAtendimento: 'Não retornar automaticamente',
      condicoesAtendimento: '',
      linksPagamento: [],
    },
  })

  useEffect(() => {
    if (
      defaultValue?.linksPagamento &&
      defaultValue.linksPagamento.length > 0
    ) {
      setPaymentLinks(defaultValue.linksPagamento)
    }
  }, [defaultValue])

  const handleFileUpload = async (file: File): Promise<string> => {
    console.log('Iniciando upload do arquivo:', file.name)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      console.log('Resposta do servidor:', response.status, response.statusText)
      if (!response.ok) {
        throw new Error(
          `Falha ao fazer upload do arquivo: ${response.status} ${response.statusText}`,
        )
      }
      const data = await response.json()
      console.log('Dados recebidos do servidor:', data)
      if (!data.fileId) {
        throw new Error('URL do arquivo não recebida do servidor')
      }
      return data.fileId
    } catch (error) {
      console.error('Erro durante o upload:', error)
      throw error
    }
  }

  const handleSubmit = async (data: z.infer<typeof upsertAIConfigSchema>) => {
    console.log('handleSubmit chamado', { isEditMode, data, paymentLinks })
    try {
      const updatedData = {
        ...data,
        linksPagamento: paymentLinks,
      }

      if (isEditMode && defaultValue) {
        updatedData.id = defaultValue.id
      }

      console.log('Antes de chamar upsertAIConfig', updatedData)
      if (onSubmit) {
        await onSubmit(updatedData)
      } else {
        const result = await upsertAIConfig(updatedData)
        if (result.error) {
          throw new Error(result.error)
        }
      }

      router.refresh()
      toast({
        title: 'Sucesso',
        description: 'Sua configuração de IA foi salva com sucesso.',
      })

      if (onSuccess) {
        onSuccess()
      }
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao salvar a configuração de IA.',
        variant: 'destructive',
      })
    }
  }

  const addPaymentLink = () => {
    setPaymentLinks([...paymentLinks, { url: '', objective: '' }])
  }

  const updatePaymentLink = (
    index: number,
    field: 'url' | 'objective',
    value: string,
  ) => {
    const updatedLinks = [...paymentLinks]
    updatedLinks[index][field] = value
    setPaymentLinks(updatedLinks)
  }

  const removePaymentLink = (index: number) => {
    const updatedLinks = paymentLinks.filter((_, i) => i !== index)
    setPaymentLinks(updatedLinks)
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
        name="cargoUsuario"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cargo do Usuário</FormLabel>
            <FormControl>
              <Input placeholder="Corretor de Imóveis" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="instrucoesAtendenteVirtual"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Instruções para o Atendente Virtual</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Detalhes específicos do atendimento"
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
                        onChange={(e) =>
                          condicoesField.onChange(e.target.value)
                        }
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
    </>
  )

  const saveButton = (
    <Button
      type="submit"
      disabled={!form.formState.isDirty || form.formState.isSubmitting}
    >
      {form.formState.isSubmitting
        ? 'Salvando...'
        : isEditMode
          ? 'Salvar Edições'
          : 'Salvar Configuração'}
    </Button>
  )

  if (isEditMode) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Configuração de IA</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na sua configuração de IA. Clique
              em "Salvar Edições" quando terminar.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
              {formContent}
              <DialogFooter>{saveButton}</DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração de IA</DialogTitle>
          <DialogDescription>
            Adicione ou edite sua configuração de IA aqui. Clique em salvar
            quando terminar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            {formContent}
            <DialogFooter>{saveButton}</DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

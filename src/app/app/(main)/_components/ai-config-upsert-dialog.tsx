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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from "@/components/ui/textarea"
import * as z from 'zod'
import { useState, useEffect } from 'react';

type AIConfigUpsertDialogProps = {
  children?: React.ReactNode
  defaultValue?: AIConfig
  onSuccess?: () => void
  isEditMode?: boolean
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (data: AIConfig) => Promise<void>
}

type PaymentLink = {
  url: string;
  objective: string;
};

export function AIConfigUpsertDialog({ children, defaultValue, onSuccess, isEditMode = false, onClose, isOpen, onSubmit }: AIConfigUpsertDialogProps) {
  const router = useRouter()
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);

  const form = useForm({
    resolver: zodResolver(upsertAIConfigSchema),
    defaultValues: defaultValue || {
      isActive: true,
      nomeAtendenteDigital: '',
      enviarParaAtendente: true,
      cargoUsuario: '',
      instrucoesAtendenteVirtual: '',
      horarioAtendimento: 'Atender 24h por dia',
      anexarInstrucoesPdf: null,
      condicoesAtendimento: '',
      linksPagamento: [],
    },
  })

  useEffect(() => {
    if (defaultValue?.linksPagamento && defaultValue.linksPagamento.length > 0) {
      setPaymentLinks(defaultValue.linksPagamento);
    }
  }, [defaultValue]);

  const handleFileUpload = async (file: File): Promise<string> => {
    console.log('Iniciando upload do arquivo:', file.name);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload', { 
        method: 'POST', 
        body: formData 
      });
      console.log('Resposta do servidor:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`Falha ao fazer upload do arquivo: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Dados recebidos do servidor:', data);
      if (!data.fileId) {
        throw new Error('URL do arquivo não recebida do servidor');
      }
      return data.fileId;
    } catch (error) {
      console.error('Erro durante o upload:', error);
      throw error;
    }
  }

  const handleSubmit = async (data: z.infer<typeof upsertAIConfigSchema>) => {
    console.log('handleSubmit chamado', { isEditMode, data, paymentLinks });
    try {
      let fileUrl = data.anexarInstrucoesPdf;

      if (data.anexarInstrucoesPdf instanceof File) {
        try {
          fileUrl = await handleFileUpload(data.anexarInstrucoesPdf);
          console.log('Upload concluído, URL:', fileUrl);
        } catch (uploadError) {
          console.error('Erro no upload do arquivo:', uploadError);
          toast({
            title: 'Erro',
            description: 'Falha ao fazer upload do arquivo. Por favor, tente novamente.',
            variant: 'destructive',
          });
          return; // Interrompe a execução se houver erro no upload
        }
      }

      const updatedData = {
        ...data,
        anexarInstrucoesPdf: fileUrl,
        linksPagamento: paymentLinks
      };

      if (isEditMode && defaultValue) {
        updatedData.id = defaultValue.id;
      }

      console.log('Antes de chamar upsertAIConfig', updatedData);
      if (onSubmit) {
        await onSubmit(updatedData);
      } else {
        const result = await upsertAIConfig(updatedData);
        if (result.error) {
          throw new Error(result.error);
        }
      }

      router.refresh();
      toast({
        title: 'Sucesso',
        description: 'Sua configuração de IA foi salva com sucesso.',
      });

      if (onSuccess) {
        onSuccess();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar a configuração de IA.',
        variant: 'destructive',
      });
    }
  }

  const addPaymentLink = () => {
    setPaymentLinks([...paymentLinks, { url: '', objective: '' }]);
  };

  const updatePaymentLink = (index: number, field: 'url' | 'objective', value: string) => {
    const updatedLinks = [...paymentLinks];
    updatedLinks[index][field] = value;
    setPaymentLinks(updatedLinks);
  };

  const removePaymentLink = (index: number) => {
    const updatedLinks = paymentLinks.filter((_, i) => i !== index);
    setPaymentLinks(updatedLinks);
  };

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
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
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
              <Input placeholder="Digite o nome do atendente digital" {...field} />
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
              <Textarea placeholder="Detalhes específicos do atendimento" {...field} />
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
                <SelectItem value="Atender 24h por dia">Atender 24h por dia</SelectItem>
                <SelectItem value="Fora do horário de atendimento">Fora do horário de atendimento</SelectItem>
                <SelectItem value="Dentro do horário de atendimento">Dentro do horário de atendimento</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="anexarInstrucoesPdf"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Anexar Instruções PDF</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file);
                          form.setValue('anexarInstrucoesPdf', file, { shouldValidate: true, shouldDirty: true });
                        }
                      }}
                      className="pl-10"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  {field.value && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() => {
                          if (typeof field.value === 'string') {
                            window.open(`/api/files/${field.value}`, '_blank');
                          } else if (field.value instanceof File) {
                            const url = URL.createObjectURL(field.value);
                            window.open(url, '_blank');
                          }
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 mr-2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Visualizar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center"
                        onClick={() => {
                          field.onChange(null);
                          form.setValue('anexarInstrucoesPdf', null, { shouldValidate: true, shouldDirty: true });
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 mr-2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Remover
                      </Button>
                    </>
                  )}
                </div>
                {field.value && (
                  <p className="text-sm text-gray-500">
                    {typeof field.value === 'string'
                      ? `Arquivo atual: ${field.value}`
                      : `Novo arquivo selecionado: ${field.value.name}`}
                  </p>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormItem className="flex flex-col rounded-lg border p-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <FormLabel className="text-base">Links de Pagamento</FormLabel>
          <Button type="button" onClick={addPaymentLink} variant="outline">
            Add URL
          </Button>
        </div>
        {paymentLinks.map((link, index) => (
          <div key={index} className="space-y-4 mt-4 relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => removePaymentLink(index)}
            >
              &#x2715;
            </Button>
            <FormItem>
              <FormLabel>Link de Pagamento {index + 1}</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://exemplo.com/pagamento"
                  value={link.url}
                  onChange={(e) => updatePaymentLink(index, 'url', e.target.value)}
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Objetivo do Link {index + 1}</FormLabel>
              <FormControl>
                <Input
                  placeholder="Descreva o objetivo do link de pagamento"
                  value={link.objective}
                  onChange={(e) => updatePaymentLink(index, 'objective', e.target.value)}
                />
              </FormControl>
            </FormItem>
          </div>
        ))}
      </FormItem>

      <FormField
        control={form.control}
        name="enviarParaAtendente"
        render={({ field }) => (
          <FormItem className="flex flex-col rounded-lg border p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enviar para Atendente</FormLabel>
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
                        onChange={(e) => condicoesField.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Ex: Quando houver problema técnico, Quando houver reclamação
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
    <Button type="submit" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
      {form.formState.isSubmitting
        ? 'Salvando...'
        : isEditMode
        ? 'Salvar Edições'
        : 'Salvar Configuração'}
    </Button>
  );

  if (isEditMode) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Configuração de IA</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na sua configuração de IA. Clique em "Salvar Edições" quando terminar.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              {formContent}
              <DialogFooter>
                {saveButton}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração de IA</DialogTitle>
          <DialogDescription>
            Adicione ou edite sua configuração de IA aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {formContent}
            <DialogFooter>
              {saveButton}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

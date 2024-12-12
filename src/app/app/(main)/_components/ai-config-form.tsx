// src/components/AIConfigForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AIConfig } from '../types';
import { upsertAIConfig } from '../actions';
import { upsertAIConfigSchema, AIConfigFormData } from '../schema';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExpandIcon, Check, ChevronsUpDown } from 'lucide-react';
import { aiTemplates, TemplateKeys } from '../templates';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Attachment = {
  type: 'link' | 'image' | 'pdf';
  content: string; // URL para links ou fileId para arquivos
  description: string;
};

type AIConfigFormProps = {
  defaultValue?: AIConfig;
  onSuccess?: () => void;
  isEditMode?: boolean;
};

// Definição dos templates em formato mais adequado para o combobox
const templateOptions = [
  {
    value: 'suporteCliente',
    label: 'Suporte ao Cliente',
    description: 'Ideal para atendimento ao cliente e suporte técnico',
  },
  {
    value: 'consultorVendas',
    label: 'Consultor de Vendas',
    description: 'Perfeito para vendas consultivas e negociações',
  },
  {
    value: 'corretor',
    label: 'Corretor de Imóveis',
    description: 'Especializado em atendimento imobiliário',
  },
];

export function AIConfigForm({
  defaultValue,
  onSuccess,
  isEditMode = false,
}: AIConfigFormProps) {
  const router = useRouter();
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState('');
  const [novoTema, setNovoTema] = useState('');
  const [temasEvitar, setTemasEvitar] = useState<string[]>(
    defaultValue?.temasEvitar || [],
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isCustomized, setIsCustomized] = useState(false);

  const form = useForm<AIConfigFormData>({
    resolver: zodResolver(upsertAIConfigSchema),
    defaultValues: defaultValue || {
      isActive: true,
      enviarParaAtendente: true,
      quemEhAtendente: '',
      oQueAtendenteFaz: '',
      objetivoAtendente: '',
      comoAtendenteDeve: '',
      horarioAtendimento: 'Atender 24h por dia',
      anexarInstrucoesPdf: null,
      condicoesAtendimento: '',
      informacoesEmpresa: '',
    },
  });

  useEffect(() => {
    if (defaultValue?.attachments && defaultValue.attachments.length > 0) {
      setAttachments(defaultValue.attachments);
    }
  }, [defaultValue]);

  // Observa mudanças no formulário
  useEffect(() => {
    const subscription = form.watch((value, { _name, type }) => {
      if (selectedTemplate && type === 'change') {
        const template = aiTemplates[selectedTemplate as TemplateKeys];
        const currentValues = form.getValues();

        // Verifica se algum valor é diferente do template
        const isDifferent = Object.keys(template).some((key) => {
          return (
            template[key as keyof typeof template] !==
            currentValues[key as keyof typeof currentValues]
          );
        });

        setIsCustomized(isDifferent);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, selectedTemplate]);

  const adicionarTema = () => {
    if (novoTema.trim()) {
      if (!temasEvitar.includes(novoTema.trim())) {
        setTemasEvitar([...temasEvitar, novoTema.trim()]);
        setNovoTema('');
      } else {
        toast({
          title: 'Tema já existe',
          description: 'Este tema já foi adicionado à lista.',
          variant: 'destructive',
        });
      }
    }
  };

  const removerTema = (index: number) => {
    const novosTemas = temasEvitar.filter((_, i) => i !== index);
    setTemasEvitar(novosTemas);
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(
          `Falha ao fazer upload do arquivo: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      if (!data.fileId) {
        throw new Error('URL do arquivo não recebida do servidor');
      }
      return data.fileId;
    } catch (error) {
      console.error('Erro durante o upload:', error);
      throw error;
    }
  };

  const handleSubmitForm = async (_name: AIConfigFormData) => {
    try {
      if (Object.keys(form.formState.errors).length > 0) {
        return;
      }

      const formData = {
        ...data,
        attachments,
        temasEvitar,
        id: isEditMode && defaultValue ? defaultValue.id : undefined,
      };

      // Usando try/catch específico para a action
      try {
        const result = await upsertAIConfig(formData);

        if (result.error) {
          throw new Error(result.error);
        }

        toast({
          title: 'Sucesso',
          description: 'Configuração salva com sucesso.',
        });

        router.refresh();

        if (onSuccess) {
          onSuccess();
        }
      } catch (actionError) {
        console.error('6. Erro na server action:', actionError);
        throw actionError;
      }
    } catch (error) {
      console.error('7. Erro geral:', error);
      toast({
        title: 'Erro',
        description:
          typeof error === 'string' ? error : 'Falha ao salvar a configuração.',
        variant: 'destructive',
      });
    }
  };

  const updatePaymentLink = (
    index: number,
    field: 'url' | 'objective',
    value: string,
  ) => {
    console.log(
      `Atualizando link de pagamento ${index + 1}, campo: ${field}, valor: ${value}`,
    );
    const updatedLinks = [...paymentLinks];
    updatedLinks[index][field] = value;
    setPaymentLinks(updatedLinks);
  };

  const handleExpandField = (fieldName: string) => {
    const currentValue = form.getValues(fieldName) as string;
    setExpandedContent(currentValue);
    setExpandedField(fieldName);
    setIsDialogOpen(true);
  };

  const handleCloseExpanded = () => {
    if (expandedField) {
      form.setValue(expandedField, expandedContent, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    setIsDialogOpen(false);
    setTimeout(() => {
      setExpandedField(null);
      setExpandedContent('');
    }, 200);
  };

  const addAttachment = () => {
    setAttachments([
      ...attachments,
      { type: 'link', content: '', description: '' },
    ]);
  };

  const updateAttachment = (
    index: number,
    field: keyof Attachment,
    value: string,
  ) => {
    const updatedAttachments = [...attachments];
    if (field === 'type') {
      updatedAttachments[index] = {
        type: value as 'link' | 'image' | 'pdf',
        content: '',
        description: '',
      };
    } else {
      updatedAttachments[index][field] = value;
    }
    setAttachments(updatedAttachments);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleTemplateSelect = (templateKey: TemplateKeys) => {
    const template = aiTemplates[templateKey];

    if (!template) {
      console.error('Modelo não encontrado:', templateKey);
      return;
    }

    // Aplica os valores do template
    Object.entries(template).forEach(([key, value]) => {
      form.setValue(key as any, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    });

    setSelectedTemplate(templateKey);
    setIsCustomized(false); // Reset do estado customizado
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
                          form.setValue('anexarInstrucoesPdf', file, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </div>
                  {field.value && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center"
                        onClick={() => {
                          console.log('Removendo arquivo selecionado');
                          field.onChange(null);
                          form.setValue('anexarInstrucoesPdf', null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
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
                          console.log(
                            'Condições de Atendimento:',
                            e.target.value,
                          );
                          condicoesField.onChange(e.target.value);
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

      <div className="space-y-6 border rounded-lg p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Informações Essenciais</h2>
        </div>

        {/* Quem é o seu Atendente */}
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
                      field.onChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* O que seu Atendente faz? */}
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
                      field.onChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Qual o objetivo do seu Atendente? */}
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
                      field.onChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Como seu Atendente deve responder? */}
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
                      console.log(
                        'Como o Atendente Deve Responder:',
                        e.target.value,
                      );
                      field.onChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Novo campo de Informações sobre a Empresa */}
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

      {/* Anexos para IA */}
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
                <Input
                  type="file"
                  accept={attachment.type === 'image' ? 'image/*' : '.pdf'}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const fileId = await handleFileUpload(file);
                        updateAttachment(index, 'content', fileId);
                      } catch (error) {
                        console.error('Erro no upload:', error);
                      }
                    }
                  }}
                />
              </FormItem>
            )}

            <FormItem>
              <FormLabel>Descrição</FormLabel>
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

      {/* Temas a evitar */}
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
                e.preventDefault();
                adicionarTema();
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
  );

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log('Form submetido');
              const formData = form.getValues();
              console.log('Dados do formulário:', formData);

              upsertAIConfig({
                ...formData,
                attachments,
                temasEvitar,
                id: isEditMode && defaultValue ? defaultValue.id : undefined,
              })
                .then((result) => {
                  console.log('Resultado da action:', result);
                  if (result.error) {
                    toast({
                      title: 'Erro',
                      description: result.error,
                      variant: 'destructive',
                    });
                  } else {
                    toast({
                      title: 'Sucesso',
                      description: 'Configuração salva com sucesso.',
                    });
                    router.refresh();
                    if (onSuccess) onSuccess();
                  }
                })
                .catch((error) => {
                  console.error('Erro ao salvar:', error);
                  toast({
                    title: 'Erro',
                    description: 'Falha ao salvar a configuração.',
                    variant: 'destructive',
                  });
                });
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
                                handleTemplateSelect(
                                  template.value as TemplateKeys,
                                );
                                setOpen(false);
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
        open={expandedField !== null}
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
  );
}

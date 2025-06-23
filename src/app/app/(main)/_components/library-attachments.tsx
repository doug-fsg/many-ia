'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ImageIcon, FileTextIcon, PlusIcon, XIcon } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { Dropzone } from '@/components/ui/dropzone'

interface Attachment {
  id: string
  type: 'image' | 'pdf'
  content: string
  description: string // Será usado como atalho (#exemplo)
}

interface LibraryAttachmentsProps {
  attachments: Attachment[]
  onUpdate: (index: number, field: keyof Attachment, value: string) => void
  onRemove: (index: number) => void
  onAdd: () => void
}

export function LibraryAttachments({ attachments, onUpdate, onRemove, onAdd }: LibraryAttachmentsProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'pdf'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const filteredAttachments = attachments.filter(attachment => {
    if (!attachment || !attachment.description) return false
    const matchesType = selectedType === 'all' || attachment.type === selectedType
    const matchesSearch = attachment.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const handleUpdateAttachment = (id: string, field: keyof Attachment, value: string) => {
    const index = attachments.findIndex(att => att.id === id)
    
    // Limpar erro existente para este campo
    if (validationErrors[id]) {
      const newErrors = { ...validationErrors }
      delete newErrors[id]
      setValidationErrors(newErrors)
    }
    
    // Se estiver atualizando a descrição, verificar se já existe
    if (field === 'description' && value !== attachments[index]?.description) {
      const isDuplicate = attachments.some(
        att => att.id !== id && att.description === value
      );
      
      if (isDuplicate) {
        setValidationErrors({
          ...validationErrors,
          [id]: "Este atalho já está sendo usado por outro anexo"
        });
        // Não retorna aqui, apenas mostra o aviso
      }
    }
    
    if (index !== -1) {
      onUpdate(index, field, value)
    }
  }

  const handleRemoveAttachment = (id: string) => {
    const index = attachments.findIndex(att => att.id === id)
    if (index !== -1) {
      onRemove(index)
    }
  }

  const handleFileUpload = async (file: File, id: string, type: 'image' | 'pdf') => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error(`Falha ao fazer upload do arquivo: ${response.status}`)
      }
      const data = await response.json()
      if (!data.fileId) {
        throw new Error('ID do arquivo não recebido do servidor')
      }
      const index = attachments.findIndex(att => att.id === id)
      if (index !== -1) {
        onUpdate(index, 'content', data.fileId)
      } else {
        console.error('Anexo não encontrado para upload:', id)
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: 'Erro de Upload',
        description: `Não foi possível fazer upload do ${type === 'image' ? 'imagem' : 'PDF'}.`,
        variant: 'destructive'
      })
    }
  }

  const handleDrop = async (id: string, type: 'image' | 'pdf', acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const index = attachments.findIndex(att => att.id === id)
      if (index !== -1) {
        await handleFileUpload(file, id, type)
      } else {
        console.error('Anexo não encontrado para drop:', id)
        toast({
          title: 'Erro',
          description: 'Não foi possível identificar o anexo para upload.',
          variant: 'destructive'
        })
      }
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-8 h-8 text-muted-foreground" />
      case 'pdf':
        return <FileTextIcon className="w-8 h-8 text-muted-foreground" />
      default:
        return null
    }
  }

  const getFileName = (content: string): string => {
    // Remove tudo antes da última barra, se houver
    const parts = content.split('/')
    return parts[parts.length - 1]
  }

  const validateShortcut = (value: string): string => {
    // Se estiver vazio, retorna #
    if (!value || value.trim() === '') {
      return '#';
    }
    
    // Remove espaços e caracteres especiais, mantém apenas letras, números e underscore
    let cleanValue = value.replace(/\s+/g, '').replace(/[^\w#]/g, '');
    
    // Limita o tamanho a 20 caracteres (incluindo o #)
    if (cleanValue.length > 20) {
      cleanValue = cleanValue.substring(0, 20);
    }
    
    // Garante que começa com #
    if (!cleanValue.startsWith('#')) {
      cleanValue = '#' + cleanValue;
    }
    
    // Se após adicionar # exceder 20 caracteres, ajusta novamente
    if (cleanValue.length > 20) {
      cleanValue = cleanValue.substring(0, 20);
    }
    
    return cleanValue;
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Barra de Ferramentas */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar por atalho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select
              value={selectedType}
              onValueChange={(value: any) => setSelectedType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">Todos os tipos</SelectItem>
                <SelectItem key="image" value="image">Imagens</SelectItem>
                <SelectItem key="pdf" value="pdf">PDFs</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={onAdd} 
              size="sm" 
              variant="outline" 
              className="whitespace-nowrap"
              type="button"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {/* Lista de Anexos */}
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4 grid grid-cols-1 gap-4">
              {filteredAttachments.map((attachment) => (
                <Card key={attachment.id} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    type="button"
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-[120px,1fr] gap-6 items-start">
                      {/* Preview */}
                      <div className="w-[120px] h-[120px] rounded-lg border flex items-center justify-center bg-secondary/10">
                        {attachment.type === 'image' && attachment.content ? (
                          <img
                            key={`img-${attachment.id}`}
                            src={`/api/files/${attachment.content}`}
                            alt={attachment.description}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div key={`icon-${attachment.id}`} className="flex items-center justify-center">
                            {getIcon(attachment.type)}
                          </div>
                        )}
                      </div>

                      {/* Campos */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <Select
                            value={attachment.type}
                            onValueChange={(value: any) =>
                              handleUpdateAttachment(attachment.id, 'type', value)
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key={`image-${attachment.id}`} value="image">Imagem</SelectItem>
                              <SelectItem key={`pdf-${attachment.id}`} value="pdf">PDF</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex-1">
                            <Input
                              placeholder="Atalho (ex: #cardapio)"
                              value={attachment.description}
                              onChange={(e) => {
                                const newValue = validateShortcut(e.target.value)
                                handleUpdateAttachment(attachment.id, 'description', newValue)
                              }}
                              maxLength={20}
                              className={validationErrors[attachment.id] ? "border-red-500" : ""}
                            />
                            {validationErrors[attachment.id] ? (
                              <p className="text-xs text-red-500 mt-1">{validationErrors[attachment.id]}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">
                                Máx. 20 caracteres, sem espaços
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="relative">
                          {attachment.content ? (
                            <div className="flex items-center space-x-4 bg-secondary/50 p-3 rounded-lg border">
                              <div className="flex-1">
                                <p className="text-sm font-medium truncate">
                                  {getFileName(attachment.content)}
                                </p>
                                <div className="flex space-x-2 mt-2">
                                  <Button 
                                    key={`view-${attachment.id}`}
                                    type="button" 
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-primary/10"
                                    onClick={() => window.open(`/api/files/${attachment.content}`, '_blank')}
                                  >
                                    Visualizar
                                  </Button>
                                  <Button 
                                    key={`remove-${attachment.id}`}
                                    type="button" 
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => handleUpdateAttachment(attachment.id, 'content', '')}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Dropzone
                              key={`dropzone-${attachment.id}`}
                              accept={{
                                'image/*': attachment.type === 'image' ? ['.jpg', '.jpeg', '.png', '.gif'] : [],
                                'application/pdf': attachment.type === 'pdf' ? ['.pdf'] : []
                              }}
                              onDrop={(files) => handleDrop(attachment.id, attachment.type, files)}
                              className="min-h-[100px]"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredAttachments.length === 0 && (
                <div key="no-attachments" className="text-center py-8 text-muted-foreground">
                  {searchTerm
                    ? 'Nenhum anexo encontrado para sua busca'
                    : 'Nenhum anexo adicionado ainda'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
} 
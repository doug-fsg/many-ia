'use client'

import { Button } from '@/components/ui/button'
import { Plus, Users, Trash2, Edit, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { TestTemplateModal } from '@/components/chat/TestTemplateModal'

interface Template {
  id: string
  name: string
  nomeAtendenteDigital: string
  createdAt: string
  isOwner: boolean
  usageCount: number
  isPublished: boolean
  _count: {
    sharedWith: number
  }
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const response = await fetch('/api/templates')
      if (!response.ok) {
        throw new Error('Erro ao carregar modelos')
      }
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar modelos')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(templateId: string) {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir modelo')
      }

      toast.success('Modelo excluído com sucesso')
      loadTemplates() // Recarrega a lista
    } catch (error) {
      console.error(error)
      toast.error('Erro ao excluir modelo')
    }
  }

  async function handlePublish(templateId: string, isPublished: boolean) {
    try {
      const response = await fetch(`/api/templates/${templateId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished }),
      })

      if (!response.ok) {
        throw new Error('Erro ao alterar status do modelo')
      }

      toast.success(isPublished ? 'Modelo publicado com sucesso' : 'Modelo despublicado com sucesso')
      loadTemplates()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao alterar status do modelo')
    }
  }

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modelos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus modelos de atendente digital
          </p>
        </div>
        <Link href="/app/templates/novo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Modelo
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-6 text-muted-foreground">
            Carregando modelos...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full text-center py-6 text-muted-foreground">
            Você ainda não criou nenhum modelo
          </div>
        ) : (
          templates.map((template) => (
            <Card 
              key={template.id} 
              className={cn(
                "relative group hover:shadow-md transition-all duration-200",
                template.isPublished ? "border-muted" : "border-dashed border-muted-foreground/50"
              )}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-semibold truncate pr-2">
                        {template.name}
                      </CardTitle>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        template.isPublished 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      )}>
                        {template.isPublished ? "Publicado" : "Rascunho"}
                      </span>
                    </div>
                    <CardDescription className="mt-1 truncate">
                      {template.nomeAtendenteDigital}
                    </CardDescription>
                  </div>
                  {template.isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handlePublish(template.id, !template.isPublished)}
                        >
                          {template.isPublished ? (
                            <>
                              <Edit className="w-4 h-4 mr-2" />
                              Despublicar
                            </>
                          ) : (
                            <>
                              <Edit className="w-4 h-4 mr-2" />
                              Publicar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/app/templates/${template.id}/editar`}
                            className="flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <TestTemplateModal
                            templateId={template.id}
                            templateName={template.name}
                            trigger={
                              <div className="flex items-center w-full">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Testar
                              </div>
                            }
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{template._count.sharedWith} usuários</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <span className="text-xs text-muted-foreground">
                  Criado em: {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 
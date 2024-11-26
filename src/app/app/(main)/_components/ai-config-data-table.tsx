'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Pencil2Icon, TrashIcon, MinusCircledIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AIConfig } from '../types'
import { deleteAIConfig, toggleAIConfigStatus, fetchFullAIConfig } from '../actions'
import { toast } from '@/components/ui/use-toast'
import { Card, CardContent } from '@/components/ui/card'

type AIConfigDataTable = {
  data: AIConfig[]
}

export function AIConfigDataTable({ data }: AIConfigDataTable) {
  const router = useRouter()

  const handleDeleteAIConfig = async (aiConfig: AIConfig) => {
    if (window.confirm('Tem certeza que deseja excluir esta configuração?')) {
      await deleteAIConfig({ id: aiConfig.id })
      router.refresh()
      toast({
        title: 'Exclusão bem-sucedida',
        description: 'A configuração de IA foi excluída com sucesso.',
      })
    }
  }

  const handleToggleActiveAIConfig = async (aiConfig: AIConfig) => {
    try {
      const result = await toggleAIConfigStatus(aiConfig.id, !aiConfig.isActive);

      if (result.error) {
        throw new Error(result.error);
      }
      
      router.refresh();
      
      toast({
        title: 'Atualização bem-sucedida',
        description: `Configuração ${!aiConfig.isActive ? 'ativada' : 'desativada'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o status.',
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (aiConfig: AIConfig) => {
    router.push(`/app/configuracoes/${aiConfig.id}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((aiConfig) => (
        <Card key={aiConfig.id} className="relative hover:shadow-md transition-shadow max-w-xs h-86">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{aiConfig.nomeAtendenteDigital}</h3>
                  <Badge 
                    className={`${aiConfig.isActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'} w-20 justify-center`}
                  >
                    {aiConfig.isActive ? 'ativo' : 'inativo'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(aiConfig)}
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
                  onClick={() => handleDeleteAIConfig(aiConfig)}
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
  )
}

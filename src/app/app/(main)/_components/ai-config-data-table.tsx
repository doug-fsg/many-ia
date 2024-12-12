'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Pencil2Icon,
  TrashIcon,
  MinusCircledIcon,
  PlusCircledIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandList,
  CommandItem,
  CommandInput,
} from '@/components/ui/command';
import { AIConfig } from '../types';
import {
  deleteAIConfig,
  toggleAIConfigStatus,
  getManytalksAccountId,
  updateAIConfigInbox,
} from '../actions';
import { buscarInboxes } from '@/lib/manytalks';

type AIConfigDataTable = {
  data: AIConfig[];
};

interface ManytalksInbox {
  id: number;
  name: string;
  channel_type: string;
}

export function AIConfigDataTable({ data }: AIConfigDataTable) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [configToDelete, setConfigToDelete] = React.useState<AIConfig | null>(
    null,
  );
  const [expandedConfig, setExpandedConfig] = React.useState<string | null>(
    null,
  );
  const [inboxes, setInboxes] = React.useState<ManytalksInbox[]>([]);
  const [openPopoverId, setOpenPopoverId] = React.useState<string | null>(null);

  const fetchInboxes = async () => {
    try {
      const accountResult = await getManytalksAccountId();
      if (accountResult.error || !accountResult.data) {
        throw new Error('ID da conta Manytalks não encontrado');
      }
      const inboxesData = await buscarInboxes(accountResult.data);
      const processedInboxes = inboxesData.data.payload.map((inbox) => ({
        id: inbox.id,
        name: inbox.name,
      }));
      setInboxes(processedInboxes);
    } catch (error) {
      console.error('Erro ao buscar inboxes:', error);
      toast({
        title: 'Erro ao buscar inboxes',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAIConfig = async () => {
    if (!configToDelete) return;

    try {
      await deleteAIConfig({ id: configToDelete.id });
      router.refresh();
      toast({
        title: 'Exclusão bem-sucedida',
        description: 'A configuração de IA foi excluída com sucesso.',
      });
      setDeleteModalOpen(false);
      setConfigToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir a configuração.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDeleteModal = (aiConfig: AIConfig) => {
    setConfigToDelete(aiConfig);
    setDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setConfigToDelete(null);
  };

  const handleToggleActiveAIConfig = async (aiConfig: AIConfig) => {
    try {
      const result = await toggleAIConfigStatus(
        aiConfig.id,
        !aiConfig.isActive,
      );

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

  const handleExpandConfig = (id: string) => {
    setExpandedConfig(expandedConfig === id ? null : id);
  };

  const handleInboxSelect = async (
    aiConfigId: string,
    inboxId: number,
    inboxName: string,
  ) => {
    try {
      const result = await updateAIConfigInbox(aiConfigId, inboxId, inboxName);

      if (result.error) {
        throw new Error(result.error);
      }

      router.refresh();
      setOpenPopoverId(null);

      toast({
        title: 'Canal atualizado',
        description: `Canal alterado para: ${inboxName}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar canal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o canal',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveInbox = async (aiConfig: AIConfig) => {
    try {
      const result = await updateAIConfigInbox(aiConfig.id, null, null);

      if (result.error) {
        throw new Error(result.error);
      }

      router.refresh();
      toast({
        title: 'Canal removido',
        description: 'Canal de entrada removido com sucesso',
      });
    } catch (error) {
      console.error('Erro ao remover canal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o canal',
        variant: 'destructive',
      });
    }
  };

  React.useEffect(() => {
    fetchInboxes();
  }, []);

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
                  <div className="flex items-center gap-2 mt-1">
                    <Popover
                      open={openPopoverId === aiConfig.id}
                      onOpenChange={(open) =>
                        setOpenPopoverId(open ? aiConfig.id : null)
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
                                  e.stopPropagation();
                                  handleRemoveInbox(aiConfig);
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
                            placeholder="Buscar canal..."
                            className="h-8 text-xs text-foreground"
                          />
                          <CommandList>
                            {inboxes.map((inbox) => (
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
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
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
  );
}

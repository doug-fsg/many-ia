'use client'

import * as React from 'react'
import { CaretSortIcon, DotsHorizontalIcon } from '@radix-ui/react-icons'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AIConfig } from '../types'
import { useRouter } from 'next/navigation'
import { deleteAIConfig, upsertAIConfig, fetchFullAIConfig } from '../actions'
import { toast } from '@/components/ui/use-toast'
import { useState, useEffect } from 'react'
import { AIConfigEditModal } from "./AIConfigEditModal"

type AIConfigDataTable = {
  data: AIConfig[]
}

export function AIConfigDataTable({ data }: AIConfigDataTable) {
  const router = useRouter()

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAIConfig, setEditingAIConfig] = useState<AIConfig | null>(null);

  const handleDeleteAIConfig = async (aiConfig: AIConfig) => {
    await deleteAIConfig({ id: aiConfig.id })
    router.refresh()

    toast({
      title: 'Exclusão bem-sucedida',
      description: 'A configuração de IA foi excluída com sucesso.',
    })
  }

  const handleToggleActiveAIConfig = async (aiConfig: AIConfig) => {
    const isActive = !aiConfig.isActive

    await upsertAIConfig({ id: aiConfig.id, isActive })
    router.refresh()

    toast({
      title: 'Atualização bem-sucedida',
      description: 'A configuração de IA foi atualizada com sucesso.',
    })
  }

  const handleEditAIConfig = async (aiConfig: AIConfig) => {
    try {
      const result = await fetchFullAIConfig(aiConfig.id);
      if (result.error) {
        throw new Error(result.error);
      }
      setEditingAIConfig(result.data);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar configuração completa:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar a configuração de IA.',
        variant: 'destructive',
      });
    }
  }

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    router.refresh();
  }

  const columns: ColumnDef<AIConfig>[] = [
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const { isActive } = row.original
        const status: 'ativo' | 'inativo' = isActive ? 'ativo' : 'inativo'
        const className = isActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
        return <Badge className={`${className} w-20 justify-center`}>{status}</Badge>
      },
    },
    {
      accessorKey: 'createdAt',
      header: () => <div className="text-left">Criado em</div>,
      cell: ({ row }) => {
        const [formattedDate, setFormattedDate] = useState('');

        useEffect(() => {
          const date = new Date(row.original.createdAt);
          setFormattedDate(date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }));
        }, [row.original.createdAt]);

        return (
          <div className="text-left font-medium">
            {formattedDate}
          </div>
        )
      },
    },
    {
      accessorKey: 'nomeAtendenteDigital',
      header: 'Nome do Atendente',
      cell: ({ row }) => <div>{row.getValue('nomeAtendenteDigital')}</div>,
    },
    {
      accessorKey: 'cargoUsuario',
      header: 'Cargo do Usuário',
      cell: ({ row }) => <div>{row.getValue('cargoUsuario')}</div>,
    },
    {
      accessorKey: 'horarioAtendimento',
      header: 'Horário de Atendimento',
      cell: ({ row }) => <div>{row.getValue('horarioAtendimento')}</div>,
    },
    {
      accessorKey: 'linksPagamento',
      header: 'Links de Pagamento',
      cell: ({ row }) => {
        const links = row.original.linksPagamento || [];
        return (
          <div>
            {links.length > 0 ? (
              links.map((link, index) => (
                <div key={index}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">{link.objective}</a>
                </div>
              ))
            ) : (
              <span>Nenhum link</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const aiConfig = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(aiConfig.id)}
              >
                Copiar ID da configuração
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditAIConfig(aiConfig)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleActiveAIConfig(aiConfig)}>
                {aiConfig.isActive ? 'Desativar' : 'Ativar'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteAIConfig(aiConfig)}>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{' '}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
      <AIConfigEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} aiConfig={editingAIConfig} onSuccess={handleEditSuccess} />
    </div>
  )
}

'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { getUserInteractions } from '../../dashboard/(main)/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface Interacao {
  id: string
  name: string
  phoneNumber: string
  interactionsCount: number
  lastMessage: string
  currentlyTalkingTo: string
  lastContactAt: string
  status: string
  interesse: string
  manytalksAccountId?: string
  ConversationID: number
}

export function RelatorioInteracoes() {
  const [interacoes, setInteracoes] = React.useState<Interacao[]>([])
  const [filteredInteracoes, setFilteredInteracoes] = React.useState<Interacao[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all') // Updated initial state
  const { toast } = useToast()

  React.useEffect(() => {
    async function fetchInteracoes() {
      setLoading(true)
      try {
        const result = await getUserInteractions()
        if (result.error) {
          setError(result.error)
          toast({
            title: 'Erro',
            description: 'Falha ao carregar as interações: ' + result.error,
            variant: 'destructive',
          })
        } else {
          setInteracoes(result.data || [])
          setFilteredInteracoes(result.data || [])
        }
      } catch (error) {
        console.error('Erro ao chamar getUserInteractions:', error)
        setError('Erro ao carregar interações: ' + (error as Error).message)
        toast({
          title: 'Erro',
          description:
            'Falha ao carregar as interações: ' + (error as Error).message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInteracoes()
  }, [toast])

  React.useEffect(() => {
    const filtered = interacoes.filter((interacao) => {
      // Verifica se o termo de busca está presente
      const matchesSearch = searchTerm === '' || 
        (
          (interacao.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false) ||
          (interacao.phoneNumber?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false) ||
          (interacao.interesse?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false)
        );
      
      // Verifica se o status corresponde ao filtro
      const matchesStatus = statusFilter === 'all' || interacao.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredInteracoes(filtered);
  }, [interacoes, searchTerm, statusFilter]);

  const uniqueStatuses = Array.from(new Set(interacoes.map(i => i.status)))

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Erro ao carregar interações: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Interações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 mb-4">
          <div className="flex-1">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Buscar por nome, telefone ou interesse"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="status">Filtrar por Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem> {/* Updated Select component */}
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
        ) : filteredInteracoes.length === 0 ? (
          <div>Nenhuma interação encontrada. Verifique os filtros aplicados.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Interesse</TableHead>
                  <TableHead>Contagens de Interações</TableHead>
                  <TableHead>Última Mensagem</TableHead>
                  <TableHead>Atualmente falando com:</TableHead>
                  <TableHead>Último Contato</TableHead>
                  <TableHead>Conversa</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInteracoes.map((interacao: Interacao) => (
                  <TableRow key={interacao.id}>
                    <TableCell>{interacao.name || 'N/A'}</TableCell>
                    <TableCell>{interacao.phoneNumber || 'N/A'}</TableCell>
                    <TableCell>{interacao.interesse || 'N/A'}</TableCell>
                    <TableCell>{interacao.interactionsCount || 0}</TableCell>
                    <TableCell>{interacao.lastMessage || 'N/A'}</TableCell>
                    <TableCell>{interacao.currentlyTalkingTo || 'N/A'}</TableCell>
                    <TableCell>
                      {interacao.lastContactAt
                        ? new Date(interacao.lastContactAt).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {interacao.manytalksAccountId && interacao.ConversationID ? (
                        <a
                          href={`https://app.manytalks.com.br/app/accounts/${interacao.manytalksAccountId}/conversations/${interacao.ConversationID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                        >
                          link
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>{interacao.status || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


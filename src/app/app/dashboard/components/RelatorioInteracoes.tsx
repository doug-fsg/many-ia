'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Search, RefreshCw, Filter, ExternalLink, Phone, MessageCircle, User, Calendar, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'

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

// Função para obter a cor do status
const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'concluído':
    case 'concluido':
    case 'finalizado':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'em andamento':
    case 'andamento':
    case 'em progresso':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'pendente':
    case 'aguardando':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'cancelado':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

// Componente para exibir o status com cor
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status || 'N/A'}
    </span>
  )
}

// Componente para exibir o link externo
const ExternalLinkButton: React.FC<{ url: string }> = ({ url }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
    >
      <ExternalLink className="h-3 w-3 mr-1" />
      Conversa
    </a>
  )
}

export function RelatorioInteracoes() {
  const [interacoes, setInteracoes] = React.useState<Interacao[]>([])
  const [filteredInteracoes, setFilteredInteracoes] = React.useState<Interacao[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [activeTab, setActiveTab] = React.useState('todos')
  const { toast } = useToast()

  const fetchInteracoes = async () => {
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
      setRefreshing(false)
    }
  }

  React.useEffect(() => {
    fetchInteracoes()
  }, [toast])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchInteracoes()
  }

  React.useEffect(() => {
    // Filtrar com base na tab ativa e nos outros filtros
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
      
      // Verifica se corresponde à tab ativa
      const matchesTab = activeTab === 'todos' || 
        (activeTab === 'recentes' && new Date(interacao.lastContactAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) ||
        (activeTab === 'frequentes' && interacao.interactionsCount > 5);
      
      return matchesSearch && matchesStatus && matchesTab;
    });
    
    setFilteredInteracoes(filtered);
  }, [interacoes, searchTerm, statusFilter, activeTab]);

  const uniqueStatuses = Array.from(new Set(interacoes.map(i => i.status)))
  
  // Estatísticas
  const totalInteracoes = interacoes.length
  const interacoesRecentes = interacoes.filter(i => 
    new Date(i.lastContactAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length
  const interacoesFrequentes = interacoes.filter(i => i.interactionsCount > 5).length

  if (error) {
    return (
      <Card>
        <CardHeader className="border-b bg-muted/40">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Erro ao Carregar Interações
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-medium mb-2">Falha ao carregar os dados</h3>
            <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Relatório de Interações</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as interações com clientes
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Atualizando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Atualizar</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Interações</p>
                  <h3 className="text-2xl font-bold">{totalInteracoes}</h3>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interações Recentes</p>
                  <h3 className="text-2xl font-bold">{interacoesRecentes}</h3>
                </div>
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Frequentes</p>
                  <h3 className="text-2xl font-bold">{interacoesFrequentes}</h3>
                </div>
                <div className="bg-violet-500/10 p-2 rounded-full">
                  <User className="h-5 w-5 text-violet-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs e Filtros */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="recentes">Recentes (7 dias)</TabsTrigger>
                <TabsTrigger value="frequentes">Frequentes (>5)</TabsTrigger>
              </TabsList>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-xs font-medium">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nome, telefone ou interesse"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-40">
                  <Label htmlFor="status" className="text-xs font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      {uniqueStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <TabsContent value="todos" className="mt-0">
              {renderTabContent(filteredInteracoes, loading)}
            </TabsContent>
            <TabsContent value="recentes" className="mt-0">
              {renderTabContent(filteredInteracoes, loading)}
            </TabsContent>
            <TabsContent value="frequentes" className="mt-0">
              {renderTabContent(filteredInteracoes, loading)}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t bg-muted/40 py-3 px-6">
          <p className="text-xs text-muted-foreground">
            Mostrando {filteredInteracoes.length} de {interacoes.length} interações
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
  
  function renderTabContent(data: Interacao[], isLoading: boolean) {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      )
    }
    
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Filter className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhuma interação encontrada</h3>
          <p className="text-muted-foreground mb-4">Verifique os filtros aplicados ou tente uma busca diferente.</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setActiveTab('todos')
            }}
          >
            Limpar filtros
          </Button>
        </div>
      )
    }
    
    return (
      <ScrollArea className="h-[500px] rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Interesse</TableHead>
                <TableHead className="text-center">Interações</TableHead>
                <TableHead>Última Mensagem</TableHead>
                <TableHead>Atendente</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((interacao: Interacao) => (
                <TableRow key={interacao.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{interacao.name || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                      {interacao.phoneNumber || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{interacao.interesse || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={interacao.interactionsCount > 5 ? "secondary" : "outline"}>
                      {interacao.interactionsCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {interacao.lastMessage || 'N/A'}
                  </TableCell>
                  <TableCell>{interacao.currentlyTalkingTo || 'N/A'}</TableCell>
                  <TableCell>
                    {interacao.lastContactAt
                      ? new Date(interacao.lastContactAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={interacao.status} />
                  </TableCell>
                  <TableCell>
                    {interacao.manytalksAccountId && interacao.ConversationID ? (
                      <ExternalLinkButton 
                        url={`https://app.manytalks.com.br/app/accounts/${interacao.manytalksAccountId}/conversations/${interacao.ConversationID}`}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    )
  }
}


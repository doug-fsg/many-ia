'use client'

import { useEffect, useState } from 'react'
import { requireSuperAdmin, logoutSuperAdmin } from '@/lib/super-admin-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  LogOut, 
  Users, 
  Activity, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ClientData {
  id: string
  name: string | null
  email: string | null
  companyName: string | null
  customCreditLimit: number | null
  monthlyInteractions: number
  monthlyValue: number
  monthlySubscription: number
  totalInteractions: number
  totalValue: number
  stripeSubscriptionStatus: string | null
  usagePercentage: number
  isOverLimit: boolean
  lastActivity: Date | null
}

export default function SuperAdminDashboard() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalMonthlyInteractions: 0,
    totalMonthlyValue: 0,
    clientsOverLimit: 0
  })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [newLimit, setNewLimit] = useState('')

  useEffect(() => {
    if (!requireSuperAdmin()) return

    fetchClientsData()
  }, [selectedYear, selectedMonth])

  const fetchClientsData = async () => {
    try {
      const monthParam = `${selectedYear}-${selectedMonth.padStart(2, '0')}`
      const response = await fetch(`/api/super_admin/clients?month=${monthParam}`)
      const data = await response.json()
      
      if (data.success) {
        setClients(data.clients)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos clientes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateLimit = async () => {
    if (!selectedClient || !newLimit) return
    
    try {
      const response = await fetch(`/api/super_admin/clients/${selectedClient.id}/limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCreditLimit: parseInt(newLimit) })
      })
      
      if (response.ok) {
        setShowLimitDialog(false)
        setNewLimit('')
        fetchClientsData() // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao atualizar limite:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Ativo</Badge>
      case 'past_due':
        return <Badge variant="destructive">Vencido</Badge>
      case 'canceled':
        return <Badge variant="secondary">Cancelado</Badge>
      case 'incomplete':
        return <Badge variant="outline">Incompleto</Badge>
      default:
        return <Badge variant="secondary">Sem assinatura</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Super Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Monitore e gerencie todos os clientes da plataforma
              </p>
            </div>
            <Button 
              onClick={logoutSuperAdmin}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de Clientes
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalClients}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Clientes Ativos
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.activeClients}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Interações/Mês
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalMonthlyInteractions.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Valor/Mês
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalMonthlyValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Acima do Limite
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.clientsOverLimit}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Monitoramento de Clientes - {new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-20"
                    placeholder="Ano"
                  />
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Janeiro</SelectItem>
                      <SelectItem value="2">Fevereiro</SelectItem>
                      <SelectItem value="3">Março</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Maio</SelectItem>
                      <SelectItem value="6">Junho</SelectItem>
                      <SelectItem value="7">Julho</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={fetchClientsData}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Limite Mensal</TableHead>
                    <TableHead>Interações</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Uso (%)</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className={client.isOverLimit ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.companyName || client.name || 'Sem nome'}</p>
                          <p className="text-sm text-gray-500">{client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(client.stripeSubscriptionStatus)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {(client.customCreditLimit || 10000).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{client.monthlyInteractions.toLocaleString()}</span>
                          </div>
                          <Progress 
                            value={client.usagePercentage} 
                            className={`h-2 ${client.isOverLimit ? 'bg-red-200' : ''}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {formatCurrency(client.monthlyValue)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {formatCurrency(client.monthlySubscription)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.isOverLimit ? 'destructive' : client.usagePercentage > 80 ? 'secondary' : 'outline'}>
                          {client.usagePercentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(client.lastActivity)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => window.location.href = `/super_admin/client/${client.id}`}
                            >
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedClient(client)
                              setNewLimit((client.customCreditLimit || 10000).toString())
                              setShowLimitDialog(true)
                            }}>
                              Ajustar limite
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 opacity-50 cursor-not-allowed">
                              Suspender conta
                              <span className="ml-2 text-xs bg-gray-100 px-1 rounded">Em breve</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {clients.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum cliente encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para ajustar limite */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Limite de Créditos</DialogTitle>
            <DialogDescription>
              Configure um novo limite personalizado para {selectedClient?.name || selectedClient?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Limite Atual</Label>
              <p className="text-sm text-muted-foreground">
                {(selectedClient?.customCreditLimit || 10000).toLocaleString()} créditos
              </p>
            </div>
            <div>
              <Label>Novo Limite</Label>
              <Input 
                type="number" 
                placeholder="Ex: 15000"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateLimit}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

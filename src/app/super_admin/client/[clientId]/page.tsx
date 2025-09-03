'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { requireSuperAdmin } from '@/lib/super-admin-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Activity, 
  DollarSign, 
  Calendar,
  Phone,
  MessageSquare,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface ClientDetails {
  id: string
  name: string | null
  email: string | null
  customCreditLimit: number | null
  stripeSubscriptionStatus: string | null
  monthlyStats: {
    interactions: number
    value: number
    usagePercentage: number
  }
  recentInteractions: Array<{
    id: string
    name: string | null
    phoneNumber: string | null
    value: number
    createdAt: Date
    status: string | null
  }>
  monthlyHistory: Array<{
    month: string
    interactions: number
    value: number
  }>
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [clientData, setClientData] = useState<ClientDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!requireSuperAdmin()) return

    fetchClientData()
  }, [params.clientId])

  const fetchClientData = async () => {
    try {
      const response = await fetch(`/api/super_admin/clients/${params.clientId}`)
      const data = await response.json()
      
      if (data.success) {
        setClientData(data.client)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados do cliente...</p>
        </div>
      </div>
    )
  }

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Cliente não encontrado</h2>
          <p className="text-muted-foreground mb-4">O cliente solicitado não existe ou não pôde ser carregado.</p>
          <Button onClick={() => router.push('/super_admin/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/super_admin/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {clientData.name || 'Cliente sem nome'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{clientData.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-base px-3 py-1">
              {clientData.stripeSubscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Interações (Mês)
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {clientData.monthlyStats.interactions.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Valor (Mês)
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(clientData.monthlyStats.value)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Limite Mensal
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(clientData.customCreditLimit || 10000).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Uso do Limite
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {clientData.monthlyStats.usagePercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Uso do Limite Mensal</CardTitle>
            <CardDescription>
              Acompanhe o consumo de interações em relação ao limite configurado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Interações utilizadas</span>
                <span>{clientData.monthlyStats.interactions} / {clientData.customCreditLimit || 10000}</span>
              </div>
              <Progress 
                value={clientData.monthlyStats.usagePercentage} 
                className={`h-3 ${clientData.monthlyStats.usagePercentage > 100 ? 'bg-red-200' : ''}`}
              />
              {clientData.monthlyStats.usagePercentage > 100 && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Cliente está acima do limite configurado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <Tabs defaultValue="interactions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="interactions">Interações Recentes</TabsTrigger>
            <TabsTrigger value="history">Histórico Mensal</TabsTrigger>
          </TabsList>

          <TabsContent value="interactions">
            <Card>
              <CardHeader>
                <CardTitle>Interações Recentes</CardTitle>
                <CardDescription>
                  Últimas interações registradas para este cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contato</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientData.recentInteractions.map((interaction) => (
                      <TableRow key={interaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            {interaction.name || 'Sem nome'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {interaction.phoneNumber || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(interaction.value)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {interaction.status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(interaction.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {clientData.recentInteractions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma interação recente encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico Mensal</CardTitle>
                <CardDescription>
                  Evolução do uso de interações e valores ao longo dos meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>Interações</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>% do Limite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientData.monthlyHistory.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell>{month.interactions.toLocaleString()}</TableCell>
                        <TableCell>{formatCurrency(month.value)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            (month.interactions / (clientData.customCreditLimit || 10000)) * 100 > 100 
                              ? 'destructive' 
                              : 'outline'
                          }>
                            {(((month.interactions / (clientData.customCreditLimit || 10000)) * 100).toFixed(1))}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {clientData.monthlyHistory.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum histórico disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

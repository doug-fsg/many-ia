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

interface Interacao {
  id: string
  name: string
  phoneNumber: string
  interactionsCount: number
  lastMessage: string
  lastContactAt: string
  status: string
  interesse: string
}

export function RelatorioInteracoes() {
  const [interacoes, setInteracoes] = React.useState<Interacao[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const { toast } = useToast()

  React.useEffect(() => {
    async function fetchInteracoes() {
      console.log('Iniciando fetchInteracoes')
      setLoading(true)
      try {
        console.log('Chamando getUserInteractions')
        const result = await getUserInteractions()
        console.log('Resultado de getUserInteractions:', result)
        if (result.error) {
          setError(result.error)
          toast({
            title: 'Erro',
            description: 'Falha ao carregar as interações: ' + result.error,
            variant: 'destructive',
          })
        } else {
          // Dados fictícios para teste
          const fakeData = [
            {
              id: '1',
              name: 'João Silva',
              phoneNumber: '(11) 98765-4321',
              interactionsCount: 5,
              lastMessage: 'Olá, como posso ajudar?',
              lastContactAt: new Date().toISOString(),
              status: 'Aberta',
              interesse: 'Alto',
            },
            {
              id: '2',
              name: 'Maria Oliveira',
              phoneNumber: '(21) 91234-5678',
              interactionsCount: 3,
              lastMessage: 'Obrigado pelo contato!',
              lastContactAt: new Date().toISOString(),
              status: 'Resolvida',
              interesse: 'Médio',
            },
          ]

          setInteracoes(fakeData)
          setLoading(false)
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

  if (loading) {
    return <div>Carregando interações...</div>
  }

  if (error) {
    return <div>Erro ao carregar interações: {error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Interações</CardTitle>
      </CardHeader>
      <CardContent>
        {interacoes.length === 0 ? (
          <div>
            Nenhuma interação encontrada. Verifique se há dados na tabela.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Interesse</TableHead>
                <TableHead>Contagens de Interações</TableHead>
                <TableHead>Última Mensagem</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interacoes.map((interacao: Interacao) => (
                <TableRow key={interacao.id}>
                  <TableCell>{interacao.name}</TableCell>
                  <TableCell>{interacao.phoneNumber}</TableCell>
                  <TableCell>{interacao.interesse}</TableCell>
                  <TableCell>{interacao.interactionsCount}</TableCell>
                  <TableCell>{interacao.lastMessage}</TableCell>
                  <TableCell>
                    {interacao.lastContactAt
                      ? new Date(interacao.lastContactAt).toLocaleString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{interacao.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

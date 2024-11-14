'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from "@/components/ui/use-toast"
import { getUserInteractions } from '../../dashboard/(main)/actions';

export function RelatorioInteracoes() {
  const [interacoes, setInteracoes] = React.useState([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchInteracoes() {
      console.log('Iniciando fetchInteracoes');
      setLoading(true);
      try {
        console.log('Chamando getUserInteractions');
        const result = await getUserInteractions();
        console.log('Resultado de getUserInteractions:', result);
        if (result.error) {
          setError(result.error);
          toast({
            title: 'Erro',
            description: 'Falha ao carregar as interações: ' + result.error,
            variant: 'destructive',
          });
        } else {
          setInteracoes(result.data || []);
        }
      } catch (error) {
        console.error('Erro ao chamar getUserInteractions:', error);
        setError('Erro ao carregar interações: ' + (error as Error).message);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar as interações: ' + (error as Error).message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchInteracoes();
  }, [toast]);

  if (loading) {
    return <div>Carregando interações...</div>;
  }

  if (error) {
    return <div>Erro ao carregar interações: {error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Interações</CardTitle>
      </CardHeader>
      <CardContent>
        {interacoes.length === 0 ? (
          <div>Nenhuma interação encontrada. Verifique se há dados na tabela.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Contagens de Interações</TableHead>
                <TableHead>Última Mensagem</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interacoes.map((interacao: any) => (
                <TableRow key={interacao.id}>
                  <TableCell>{interacao.name}</TableCell>
                  <TableCell>{interacao.phoneNumber}</TableCell>
                  <TableCell>{interacao.interactionsCount}</TableCell>
                  <TableCell>{interacao.lastMessage}</TableCell>
                  <TableCell>{interacao.lastContactAt ? new Date(interacao.lastContactAt).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{interacao.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
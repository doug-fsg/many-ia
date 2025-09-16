'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { calculateCredits, calculateInteractions } from '../../dashboard/(main)/actions';
import { Loader2, TrendingUp, TrendingDown, CreditCard, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MotionCard = motion(Card);
const MotionProgress = motion(Progress);

// Função auxiliar para formatar números
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

// Função auxiliar para calcular porcentagem com segurança
const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

// Função para determinar a cor do progresso baseado no percentual
const getProgressColor = (percentage: number): string => {
  if (percentage < 50) return 'bg-emerald-500';
  if (percentage < 75) return 'bg-amber-500';
  return 'bg-rose-500';
};

interface RelatorioTesteProps {
  periodFilter?: 'month' | 'week' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
}

export const RelatorioTeste: React.FC<RelatorioTesteProps> = ({
  periodFilter = 'month',
  customStartDate,
  customEndDate,
}) => {
  const [credits, setCredits] = useState<{
    totalCreditsMonth: number;
    totalCreditsWeek: number;
    remainingCredits: number;
  } | null>(null);
  const [interactions, setInteractions] = useState<{
    weeklyInteractions: number;
    monthlyInteractions: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      // Preparar parâmetros de filtro
      const params: any = { period: periodFilter };
      
      if (periodFilter === 'custom' && customStartDate && customEndDate) {
        params.startDate = new Date(customStartDate);
        params.endDate = new Date(customEndDate);
      }

      const [creditResult, interactionResult] = await Promise.all([
        calculateCredits(params),
        calculateInteractions(params)
      ]);

      if (creditResult.error) throw new Error(creditResult.error);
      if (interactionResult.error) throw new Error(interactionResult.error);

      setCredits(creditResult);
      setInteractions(interactionResult);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [periodFilter, customStartDate, customEndDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  if (loading && !refreshing) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando dados do relatório...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-destructive font-medium">Erro ao carregar dados</div>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button variant="outline" onClick={handleRefresh}>Tentar novamente</Button>
      </div>
    );
  }

  if (!credits || !interactions) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-muted-foreground">Dados não disponíveis</div>
        <Button variant="outline" onClick={handleRefresh} className="mt-4">Tentar novamente</Button>
      </div>
    );
  }

  const { totalCreditsMonth, totalCreditsWeek, remainingCredits } = credits;
  const { weeklyInteractions, monthlyInteractions } = interactions;

  const totalCredits = totalCreditsMonth + remainingCredits;
  const porcentagemCreditoUsado = calculatePercentage(totalCreditsMonth, totalCredits);
  const porcentagemCreditoSemana = calculatePercentage(totalCreditsWeek, totalCredits);
  
  // Determina a tendência de uso (crescente ou decrescente)
  const isHighUsage = porcentagemCreditoUsado > 70;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Créditos</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="flex items-center gap-2"
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

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {/* Card Resumo de Créditos */}
          <MotionCard
            className="sm:col-span-2 overflow-hidden border-l-4"
            style={{ borderLeftColor: isHighUsage ? 'rgb(244, 63, 94)' : 'rgb(16, 185, 129)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Créditos do Mês</CardTitle>
                <CreditCard className={`h-6 w-6 ${isHighUsage ? 'text-rose-500' : 'text-emerald-500'}`} />
              </div>
              <CardDescription>Resumo do consumo de créditos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Disponível</p>
                  <h3 className="text-2xl font-bold">{formatNumber(totalCredits)}</h3>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Restante</p>
                  <h3 className="text-2xl font-bold">{formatNumber(remainingCredits)}</h3>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Consumo</span>
                  <span className={`font-medium ${isHighUsage ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {porcentagemCreditoUsado.toFixed(1)}%
                    {isHighUsage ? 
                      <TrendingUp className="h-4 w-4 inline ml-1" /> : 
                      <TrendingDown className="h-4 w-4 inline ml-1" />
                    }
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <MotionProgress
                        value={porcentagemCreditoUsado}
                        className={`h-full transition-all ${getProgressColor(porcentagemCreditoUsado)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${porcentagemCreditoUsado}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatNumber(totalCreditsMonth)} créditos usados de {formatNumber(totalCredits)}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
            <CardFooter className="pt-0 pb-3">
              <p className="text-xs text-muted-foreground">
                Atualizado em {new Date().toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </CardFooter>
          </MotionCard>

          {/* Card Créditos da Semana */}
          <MotionCard
            className="overflow-hidden border-t-4 border-t-blue-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Créditos da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-bold mb-2">{formatNumber(totalCreditsWeek)}</div>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <MotionProgress
                    value={porcentagemCreditoSemana}
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${porcentagemCreditoSemana}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {porcentagemCreditoSemana.toFixed(1)}% do total mensal
                </p>
              </div>
            </CardContent>
          </MotionCard>

          {/* Card Interações */}
          <MotionCard
            className="overflow-hidden border-t-4 border-t-violet-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Clientes Atendidos</CardTitle>
                <Users className="h-5 w-5 text-violet-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
                  <h3 className="text-2xl font-bold">{formatNumber(weeklyInteractions)}</h3>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Este Mês</p>
                  <h3 className="text-2xl font-bold">{formatNumber(monthlyInteractions)}</h3>
                </div>
              </div>
            </CardContent>
          </MotionCard>
        </motion.div>
      </div>
    </TooltipProvider>
  );
};


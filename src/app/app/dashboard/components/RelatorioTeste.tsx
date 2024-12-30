'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { calculateCredits, calculateInteractions } from '../../dashboard/(main)/actions';
import { Loader2 } from 'lucide-react';

const MotionCard = motion(Card);
const MotionProgress = motion(Progress);

export const RelatorioTeste: React.FC = () => {
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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [creditResult, interactionResult] = await Promise.all([
          calculateCredits(),
          calculateInteractions()
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
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Erro ao carregar dados: {error}</div>;
  }

  if (!credits || !interactions) {
    return <div>Dados não disponíveis</div>;
  }

  const { totalCreditsMonth, totalCreditsWeek, remainingCredits } = credits;
  const { weeklyInteractions, monthlyInteractions } = interactions;

  const totalCredits = totalCreditsMonth + remainingCredits;
  const porcentagemCreditoUsado = (totalCreditsMonth / totalCredits) * 100;
  const porcentagemCreditoSemana = (totalCreditsWeek / totalCredits) * 100;

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 md:grid-cols-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      {/* Card Créditos Totais e Restantes */}
      <MotionCard
        className="sm:col-span-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      >
        <CardHeader>
          <CardTitle>Créditos do Mês</CardTitle>
          <CardDescription>Total de créditos e créditos restantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-2">
            <span>Total: {totalCredits}</span>
            <span>Restante: {remainingCredits}</span>
          </div>
          <MotionProgress
            value={porcentagemCreditoUsado}
            aria-label={`Créditos usados: ${porcentagemCreditoUsado.toFixed(2)}%`}
            initial={{ width: 0 }}
            animate={{ width: `${porcentagemCreditoUsado}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            whileHover={{ opacity: 0.8 }}
            className="h-4"
          />
          <div className="text-sm text-muted-foreground mt-2">
            {totalCreditsMonth} créditos usados ({porcentagemCreditoUsado.toFixed(2)}%)
          </div>
        </CardContent>
      </MotionCard>

      {/* Card Total de Créditos na Semana */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      >
        <CardHeader>
          <CardTitle>Créditos da Semana</CardTitle>
          <CardDescription>Total de créditos gastos na semana</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.p className="text-3xl font-bold mb-2">{totalCreditsWeek}</motion.p>
          <MotionProgress
            value={porcentagemCreditoSemana}
            aria-label={`Créditos gastos na semana: ${porcentagemCreditoSemana.toFixed(2)}%`}
            initial={{ width: 0 }}
            animate={{ width: `${porcentagemCreditoSemana}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            whileHover={{ opacity: 0.8 }}
            className="h-4"
          />
          <div className="text-sm text-muted-foreground mt-2">
            {porcentagemCreditoSemana.toFixed(2)}% do total
          </div>
        </CardContent>
      </MotionCard>

      {/* Card Clientes Atendidos na Semana */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      >
        <CardHeader>
          <CardTitle>Clientes Atendidos na Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.p className="text-3xl font-bold">{weeklyInteractions}</motion.p>
        </CardContent>
      </MotionCard>

      {/* Card Clientes Atendidos no Mês */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      >
        <CardHeader>
          <CardTitle>Clientes Atendidos no Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.p className="text-3xl font-bold">{monthlyInteractions}</motion.p>
        </CardContent>
      </MotionCard>
    </motion.div>
  );
};


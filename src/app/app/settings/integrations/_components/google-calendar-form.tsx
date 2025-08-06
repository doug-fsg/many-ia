'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { upsertAIConfigSchema } from '@/app/app/(main)/schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';

const diasDaSemana = [
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
  { value: '0', label: 'Domingo' },
];

const duracoesPadrao = [
  { value: '30', label: '30 minutos' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1 hora e 30 minutos' },
  { value: '120', label: '2 horas' },
];

const lembretes = [
  { value: '10', label: '10 minutos antes' },
  { value: '30', label: '30 minutos antes' },
  { value: '60', label: '1 hora antes' },
  { value: '1440', label: '1 dia antes' },
];

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao buscar dados');
  return res.json();
};

interface GoogleCalendarFormProps {
  onSuccess?: () => void;
}

export function GoogleCalendarForm({ onSuccess }: GoogleCalendarFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Buscar status da integração
  const { data: statusData } = useSWR('/api/integrations/google-calendar/status', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 300000, // 5 minutos
  });

  // Buscar configurações apenas se houver integração ativa
  const { data: configData } = useSWR(
    statusData?.integration ? '/api/integrations/google-calendar/config' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Buscar calendários apenas se houver integração ativa
  const { data: calendarsData } = useSWR(
    statusData?.integration ? '/api/integrations/google-calendar/calendars' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const form = useForm({
    resolver: zodResolver(upsertAIConfigSchema),
    defaultValues: {
      googleCalendarEnabled: configData?.config?.googleCalendarEnabled ?? false,
      defaultEventDuration: configData?.config?.defaultEventDuration ?? 60,
      workingHoursStart: configData?.config?.workingHoursStart ?? '09:00',
      workingHoursEnd: configData?.config?.workingHoursEnd ?? '18:00',
      allowedDays: configData?.config?.allowedDays ?? ['1', '2', '3', '4', '5'],
      minAdvanceTime: configData?.config?.minAdvanceTime ?? 1,
      maxAdvanceTime: configData?.config?.maxAdvanceTime ?? 30,
      defaultReminder: configData?.config?.defaultReminder ?? 30,
      autoCreateEvents: configData?.config?.autoCreateEvents ?? false,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/integrations/google-calendar/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar configurações');
      }

      toast({
        title: 'Sucesso',
        description: 'Configurações do Google Calendar salvas com sucesso.',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Se não houver integração ativa, não mostrar o formulário
  if (!statusData?.integration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Google Calendar</CardTitle>
          <CardDescription>
            Conecte sua conta do Google Calendar primeiro para configurar as opções.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Google Calendar</CardTitle>
        <CardDescription>
          Configure como seu agente deve gerenciar eventos no Google Calendar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="googleCalendarEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativar Integração</FormLabel>
                    <FormDescription>
                      Permitir que o agente crie eventos no Google Calendar
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('googleCalendarEnabled') && (
              <>
                <FormField
                  control={form.control}
                  name="defaultEventDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração Padrão dos Eventos</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a duração padrão" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {duracoesPadrao.map((duracao) => (
                            <SelectItem key={duracao.value} value={duracao.value}>
                              {duracao.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Duração padrão para eventos criados pelo agente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="workingHoursStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de Início</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workingHoursEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de Término</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="allowedDays"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Dias Permitidos</FormLabel>
                        <FormDescription>
                          Selecione os dias em que o agente pode criar eventos
                        </FormDescription>
                      </div>
                      {diasDaSemana.map((dia) => (
                        <FormField
                          key={dia.value}
                          control={form.control}
                          name="allowedDays"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={dia.value}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(dia.value)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, dia.value])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value: string) => value !== dia.value
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {dia.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="minAdvanceTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Antecedência Mínima (horas)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={24}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Mínimo de horas antes para agendar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAdvanceTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Antecedência Máxima (dias)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={90}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Máximo de dias para agendar no futuro
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="defaultReminder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lembrete Padrão</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione quando enviar o lembrete" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lembretes.map((lembrete) => (
                            <SelectItem key={lembrete.value} value={lembrete.value}>
                              {lembrete.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Quando o participante deve receber o lembrete do evento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoCreateEvents"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Criação Automática</FormLabel>
                        <FormDescription>
                          Criar eventos automaticamente após coletar informações
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 
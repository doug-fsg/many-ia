'use client';

import { Control, FieldValues, Path, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Section } from '@/components/ui/section';
import { Clock } from 'lucide-react';

const diasDaSemana = [
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
  { value: '0', label: 'Domingo' },
];

type WeeklyScheduleFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  /** Ex.: "weeklySchedule" ou "agendas.0.weeklySchedule" */
  basePath: Path<T>;
};

export function GoogleCalendarWeeklyScheduleFields<T extends FieldValues>({
  control,
  basePath,
}: WeeklyScheduleFieldsProps<T>) {
  const weeklySchedule = useWatch({ control, name: basePath as any }) as Record<
    string,
    {
      enabled?: boolean;
      start?: string;
      end?: string;
      hasBreak?: boolean;
      breakStart?: string;
      breakEnd?: string;
    }
  >;

  return (
    <Section title="Horários por dia da semana" icon={<Clock className="h-4 w-4 text-primary" />}>
      <div className="grid gap-4">
        {diasDaSemana.map((dia) => {
          const watchedValue = weeklySchedule?.[dia.value];
          const daySchedule = watchedValue
            ? {
                enabled: watchedValue.enabled ?? false,
                start: watchedValue.start ?? '',
                end: watchedValue.end ?? '',
                hasBreak: watchedValue.hasBreak ?? false,
                breakStart: watchedValue.breakStart ?? '',
                breakEnd: watchedValue.breakEnd ?? '',
              }
            : {
                enabled: false,
                start: '',
                end: '',
                hasBreak: false,
                breakStart: '',
                breakEnd: '',
              };

          const dayPrefix = `${basePath}.${dia.value}` as Path<T>;

          return (
            <div key={dia.value} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FormField
                    control={control}
                    name={`${dayPrefix}.enabled` as Path<T>}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-4 w-7 data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <span className="text-sm font-medium">{dia.label}</span>
                </div>
                {daySchedule.enabled && (
                  <div className="text-xs text-muted-foreground">
                    {daySchedule.start} - {daySchedule.end}
                    {daySchedule.hasBreak && ' (com intervalo)'}
                  </div>
                )}
              </div>

              {daySchedule.enabled && (
                <div className="grid grid-cols-1 gap-4 pl-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Horário</label>
                    <div className="flex items-center gap-2">
                      <FormField
                        control={control}
                        name={`${dayPrefix}.start` as Path<T>}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="time" {...field} className="h-8 text-sm" placeholder="--:--" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <span className="text-sm text-muted-foreground">até</span>
                      <FormField
                        control={control}
                        name={`${dayPrefix}.end` as Path<T>}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="time" {...field} className="h-8 text-sm" placeholder="--:--" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FormField
                        control={control}
                        name={`${dayPrefix}.hasBreak` as Path<T>}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="h-4 w-7 data-[state=checked]:bg-primary"
                              />
                            </FormControl>
                            <span className="text-xs font-medium text-muted-foreground">Intervalo</span>
                          </FormItem>
                        )}
                      />
                    </div>
                    {daySchedule.hasBreak && (
                      <div className="flex items-center gap-2">
                        <FormField
                          control={control}
                          name={`${dayPrefix}.breakStart` as Path<T>}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="time" {...field} className="h-8 text-sm" placeholder="--:--" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <span className="text-sm text-muted-foreground">até</span>
                        <FormField
                          control={control}
                          name={`${dayPrefix}.breakEnd` as Path<T>}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="time" {...field} className="h-8 text-sm" placeholder="--:--" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

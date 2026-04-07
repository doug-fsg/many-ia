// src/schema.ts
import { z } from 'zod'

const dayScheduleSchema = z.object({
  enabled: z.boolean().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  hasBreak: z.boolean().optional(),
  breakStart: z.string().optional(),
  breakEnd: z.string().optional(),
})

export const agendaItemSchema = z
  .object({
    id: z.string().min(1),
    enabled: z.boolean().optional(),
    name: z.string().min(1, 'Nome da agenda é obrigatório'),
    calendarId: z.string().min(1, 'Selecione um calendário'),
    weeklySchedule: z.record(dayScheduleSchema).optional(),
    defaultEventDuration: z.number().min(30).max(120),
    minAdvanceTime: z.number().min(0).max(24).optional(),
    maxAdvanceTime: z.number().min(1).max(90).optional(),
    defaultReminder: z.number().nullable().optional(),
    reminderMessage: z.string().optional(),
    eventType: z.string().optional(),
    responsibleEmails: z.array(z.string()).optional(),
    enableScarcityMode: z.boolean().optional(),
    maxSlotsToShow: z.number().min(1).max(50).optional(),
    aiPrompt: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.enabled === false) return;
    if (!String(data.aiPrompt ?? '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O prompt para IA desta agenda é obrigatório.',
        path: ['aiPrompt'],
      });
    }
  })

// const paymentLinkSchema = z.object({
//   url: z.string().url('URL inválida'),
//   objective: z.string().min(1, 'O objetivo é obrigatório'),
// })

export const upsertAIConfigSchema = z.object({
  id: z.string().optional(),
  isActive: z.boolean().default(true),
  detectarIdioma: z.boolean().default(false),
  enviarParaAtendente: z.boolean().default(true),
  nomeAtendenteDigital: z
    .string()
    .min(1, 'O nome do atendente digital é obrigatório'),
  quemEhAtendente: z.string().min(1, 'Este campo é obrigatório'),
  oQueAtendenteFaz: z.string().min(1, 'Este campo é obrigatório'),
  objetivoAtendente: z.string().min(1, 'Este campo é obrigatório'),
  comoAtendenteDeve: z.string().min(1, 'Este campo é obrigatório'),
  horarioAtendimento: z.enum([
    'Atender 24h por dia',
    'Fora do horário de atendimento',
    'Dentro do horário de atendimento',
  ]),
  tempoRetornoAtendimento: z.string().optional(),
  informacoesEmpresa: z.string().min(1, 'Este campo é obrigatório'),
  condicoesAtendimento: z.string().optional(),
  inboxId: z.number().optional(),
  inboxName: z.string().optional(),
  attachments: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.enum(['image', 'pdf', 'audio', 'video']),
        content: z.string(),
        description: z.string(),
      }),
    )
    .default([]),
  temasEvitar: z.array(z.union([z.string(), z.object({ tema: z.string() })])).default([]),
  // Campos para Google Calendar - todos opcionais
  googleCalendarEnabled: z.boolean().optional(),
  calendarId: z.string().optional(),
  defaultEventDuration: z.number().optional(),
  weeklySchedule: z.any().optional(), // JSON object
  minAdvanceTime: z.number().optional(),
  maxAdvanceTime: z.number().optional(),
  defaultReminder: z.number().nullable().optional(),
  reminderMessage: z.string().optional(),
  autoCreateEvents: z.boolean().optional(),
  eventType: z.string().optional(),
  responsibleEmails: z.array(z.string()).optional(),
  aiPrompt: z.string().optional(),
  enableScarcityMode: z.boolean().optional(),
  maxSlotsToShow: z.number().optional(),
  /** Múltiplas agendas; null/omitido = modo legado (campos no nível do AIConfig) */
  agendas: z.array(agendaItemSchema).nullable().optional(),
})

export const deleteAIConfigSchema = z.object({
  id: z.string(),
})

export type AIConfigFormData = z.infer<typeof upsertAIConfigSchema>

// src/schema.ts
import { z } from 'zod'

// const paymentLinkSchema = z.object({
//   url: z.string().url('URL inválida'),
//   objective: z.string().min(1, 'O objetivo é obrigatório'),
// })

export const upsertAIConfigSchema = z.object({
  id: z.string().optional(),
  isActive: z.boolean().default(true),
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
        type: z.enum(['link', 'image', 'pdf']),
        content: z.string(),
        description: z.string(),
      }),
    )
    .default([]),
  temasEvitar: z.array(z.union([z.string(), z.object({ tema: z.string() })])).default([]),
  // Campos para Google Calendar - todos verdadeiramente opcionais
  googleCalendarEnabled: z.boolean().optional(),
  calendarId: z.string().optional(),
  defaultEventDuration: z.number().optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  allowedDays: z.array(z.string()).optional(),
  minAdvanceTime: z.number().optional(),
  maxAdvanceTime: z.number().optional(),
  defaultReminder: z.number().nullable().optional(),
  reminderMessage: z.string().optional(),
  autoCreateEvents: z.boolean().optional()
})

export const deleteAIConfigSchema = z.object({
  id: z.string(),
})

export type AIConfigFormData = z.infer<typeof upsertAIConfigSchema>

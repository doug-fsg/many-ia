import { z } from 'zod'

const paymentLinkSchema = z.object({
  url: z.string().url("URL inválida"),
  objective: z.string().min(1, "O objetivo é obrigatório"),
})

export const upsertAIConfigSchema = z.object({
  id: z.string().optional(),
  isActive: z.boolean().default(true),
  nomeAtendenteDigital: z.string().min(1, "O nome do atendente digital é obrigatório"),
  enviarParaAtendente: z.boolean(),
  cargoUsuario: z.string().min(1, "O cargo do usuário é obrigatório"),
  instrucoesAtendenteVirtual: z.string(),
  horarioAtendimento: z.enum(["Atender 24h por dia", "Fora do horário de atendimento", "Dentro do horário de atendimento"]),
  anexarInstrucoesPdf: z.union([z.instanceof(File), z.string()]).nullable(),
  condicoesAtendimento: z.string().optional(),
  linksPagamento: z.array(paymentLinkSchema),
})

export const deleteAIConfigSchema = z.object({
  id: z.string(),
})
import { ReturnTypeWithoutPromise } from '@/types/return-type-without-promise'
import { getUserAIConfigs } from './actions'

export type AIConfig = {
  id?: string
  isActive: boolean
  detectarIdioma?: boolean
  nomeAtendenteDigital: string
  enviarParaAtendente: boolean
  quemEhAtendente: string
  oQueAtendenteFaz: string
  objetivoAtendente: string
  comoAtendenteDeve: string
  horarioAtendimento: string
  tempoRetornoAtendimento: string
  condicoesAtendimento?: string
  informacoesEmpresa: string
  inboxId?: number
  inboxName?: string
  userId?: string
  temasEvitar?: Array<{ tema: string }>
  attachments?: Array<{
    id?: string
    type: 'image' | 'pdf' | 'audio' | 'video'
    content: string
    description: string
  }>
  // Campos para Google Calendar
  googleCalendarEnabled?: boolean
  calendarId?: string
  defaultEventDuration?: number
  weeklySchedule?: any
  minAdvanceTime?: number
  maxAdvanceTime?: number
  defaultReminder?: number
  reminderMessage?: string
  autoCreateEvents?: boolean
  eventType?: string
  responsibleEmails?: string[]
  aiPrompt?: string
  enableScarcityMode?: boolean
  maxSlotsToShow?: number
}

export type TemplateStatus = 'PUBLIC' | 'PRIVATE'

export type Template = {
  id: string
  name: string
  nomeAtendenteDigital: string
  enviarParaAtendente: boolean
  quemEhAtendente: string
  oQueAtendenteFaz: string
  objetivoAtendente: string
  comoAtendenteDeve: string
  horarioAtendimento: string
  tempoRetornoAtendimento: string
  condicoesAtendimento: string
  informacoesEmpresa: string
  status: TemplateStatus
}

export type TemplateOption = {
  value: string
  label: string
  description: string
  template: Template
}

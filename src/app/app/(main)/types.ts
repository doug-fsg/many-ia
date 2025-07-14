import { ReturnTypeWithoutPromise } from '@/types/return-type-without-promise'
import { getUserAIConfigs } from './actions'

export type AIConfig = {
  id?: string
  isActive: boolean
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
    type: 'link' | 'image' | 'pdf'
    content: string
    description: string
  }>
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

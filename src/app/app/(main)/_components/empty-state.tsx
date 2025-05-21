'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface EmptyStateProps {
  hasConfigs: boolean
  hasWhatsApp: boolean
  onDismiss: () => void
}

export function EmptyState({ hasConfigs, hasWhatsApp, onDismiss }: EmptyStateProps) {
  const router = useRouter()

  // Função para determinar qual conteúdo mostrar baseado no estado
  const getContent = () => {
    // Caso 1: Nenhuma configuração e nenhum WhatsApp
    if (!hasConfigs && !hasWhatsApp) {
      return {
        icon: <Bot className="w-12 h-12 text-primary-500" />,
        title: "Crie seu primeiro Assistente Virtual",
        description: "Comece agora mesmo a automatizar seus atendimentos com inteligência artificial",
        steps: [
          {
            title: "Passo 1",
            description: "Configure seu assistente virtual com personalidade e conhecimento específico",
            icon: <Bot className="w-4 h-4" />
          },
          {
            title: "Passo 2",
            description: "Conecte com seu WhatsApp e comece a atender seus clientes automaticamente",
            icon: (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            )
          }
        ],
        action: {
          label: "Criar Assistente",
          onClick: () => router.push("/app/configuracoes/nova")
        }
      }
    }

    // Caso 2: Tem configuração mas não tem WhatsApp
    if (hasConfigs && !hasWhatsApp) {
      return {
        icon: (
          <svg viewBox="0 0 24 24" className="w-12 h-12 text-primary-500">
            <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        ),
        title: "Conecte seu WhatsApp",
        description: "Sua configuração está pronta! Agora é hora de conectar com o WhatsApp para começar os atendimentos",
        steps: [
          {
            title: "Como conectar",
            description: "Vá até as configurações do WhatsApp e escaneie o QR Code com seu celular",
            icon: (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            )
          },
          {
            title: "Próximo passo",
            description: "Após conectar, vincule o WhatsApp à sua configuração de IA e comece a atender",
            icon: <Bot className="w-4 h-4" />
          }
        ],
        action: {
          label: "Conectar WhatsApp",
          onClick: () => router.push("/app/settings/whatsapp")
        }
      }
    }

    // Caso 3: Tem WhatsApp mas não tem configuração
    if (!hasConfigs && hasWhatsApp) {
      return {
        icon: <Bot className="w-12 h-12 text-primary-500" />,
        title: "Configure seu Assistente",
        description: "Seu WhatsApp já está conectado! Agora vamos criar seu assistente virtual",
        steps: [
          {
            title: "Personalização",
            description: "Defina a personalidade e conhecimento do seu assistente virtual",
            icon: <Bot className="w-4 h-4" />
          },
          {
            title: "Integração",
            description: "Vincule seu WhatsApp já conectado ao seu novo assistente",
            icon: (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            )
          }
        ],
        action: {
          label: "Criar Atendente",
          onClick: () => router.push("/app/configuracoes/nova")
        }
      }
    }
  }

  const content = getContent()

  if (!content) return null

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-2xl relative">
        {/* Botão de fechar */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <CardContent className="p-6">
          <div className="text-center space-y-6">
            {/* Ícone animado */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary-400 to-primary-100 opacity-50 blur-lg" />
                <div className="relative bg-white rounded-full p-4">
                  {content.icon}
                </div>
              </div>
            </motion.div>

            {/* Título e descrição */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">{content.title}</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {content.description}
              </p>
            </div>

            {/* Cards de passos */}
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto mt-8">
              {content.steps.map((step, index) => (
                <Card key={index} className="bg-primary-50/50 border-primary-100">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-primary-600">
                      <div className="rounded-full bg-primary-100 p-1.5">
                        {step.icon}
                      </div>
                      <span className="font-medium">{step.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Botão de ação */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="pt-4"
            >
              <Button
                onClick={content.action.onClick}
                size="lg"
                className="bg-gradient-to-r from-primary-600 to-primary-400 hover:from-primary-700 hover:to-primary-500"
              >
                {content.action.label}
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
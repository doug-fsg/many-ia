'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, SendIcon } from 'lucide-react'

// Função para gerar um ID único sem depender do uuid
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}

type Message = {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface ChatTestProps {
  agentId: string
  agentName: string
  accountId?: string
  inboxId?: number
}

export function ChatTest({ agentId, agentName, accountId, inboxId }: ChatTestProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(generateId())

  // Efeito para iniciar o chat com uma mensagem de boas-vindas
  useEffect(() => {
    setMessages([
      {
        id: generateId(),
        text: `Olá! Eu sou ${agentName}. Como posso ajudar você hoje?`,
        isUser: false,
        timestamp: new Date(),
      },
    ])
  }, [agentName])

  // Efeito para rolar automaticamente para a mensagem mais recente
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Preparar payload para envio ao webhook
      const payload = [
        {
          fromme: true,
          extra: {
            account: accountId || "testAccount",
            inbox: inboxId || "testInbox"
          },
          chat: {
            id: sessionId.current
          },
          id: agentId,
          debug: true,
          timestamp: new Date().toISOString(),
          text: inputMessage,
          type: "text"
        }
      ]

      // Enviar requisição para o endpoint local que encaminhará para o n8n
      const response = await fetch('/api/chat/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Falha ao obter resposta do agente')
      }

      const responseData = await response.json()

      // Adicionar respostas do agente como mensagens individuais
      if (Array.isArray(responseData)) {
        if (responseData.length > 1) {
          // Se houver múltiplas mensagens, mostrar indicador de digitação por 1 segundo
          setIsTyping(true)
          await new Promise(resolve => setTimeout(resolve, 1000))
          setIsTyping(false)
        }
        
        // Adicionar mensagens com pequeno delay entre elas
        for (let i = 0; i < responseData.length; i++) {
          const botMessage = responseData[i]
          
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: generateId(),
                text: botMessage.text,
                isUser: false,
                timestamp: new Date(),
              },
            ])
          }, i * 300) // 300ms de intervalo entre mensagens
        }
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          text: 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
          isUser: false,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardContent className="flex flex-col h-full p-4">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[500px] pr-4" ref={scrollAreaRef}>
            <div className="space-y-4 pt-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {(isLoading || isTyping) && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage()
              }
            }}
            disabled={isLoading || isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || isTyping || !inputMessage.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, SendIcon, ChevronDown, FileIcon, FileTextIcon, Film } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

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
  isTemplate?: boolean
  helpText?: string
}

export function ChatTest({ agentId, agentName, accountId, inboxId, isTemplate = false, helpText }: ChatTestProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(generateId())
  const shouldScrollRef = useRef(true)

  // Função para verificar se o usuário está próximo do final do chat
  const isNearBottom = () => {
    if (!scrollAreaRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
    // Considera "próximo do final" se estiver a 100px do fim
    return scrollHeight - scrollTop - clientHeight < 100
  }

  // Função para rolar para o final do chat
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
    
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Verifica se deve rolar para baixo quando mensagens mudam
  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToBottom();
    } else {
      setShowScrollButton(true);
    }
  }, [messages]);

  // Efeito para rolar automaticamente quando o indicador de digitação muda
  useEffect(() => {
    if (isTyping && shouldScrollRef.current) {
      scrollToBottom();
    }
  }, [isTyping]);

  // Monitorar o scroll para mostrar/esconder o botão e determinar se deve rolar automaticamente
  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const handleScroll = () => {
      const isBottom = isNearBottom();
      shouldScrollRef.current = isBottom;
      setShowScrollButton(!isBottom);
    }

    scrollArea.addEventListener('scroll', handleScroll)
    return () => scrollArea.removeEventListener('scroll', handleScroll)
  }, [])

  // Função para processar o texto e garantir que quebras de linha sejam respeitadas
  const processMessageText = (text: string) => {
    // Substitui \n por quebras de linha explícitas no markdown (dois espaços + \n)
    return text.replace(/\n/g, '  \n');
  };

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
    // Forçar rolagem após enviar mensagem do usuário
    shouldScrollRef.current = true;
    setTimeout(scrollToBottom, 50);

    try {
      // Preparar payload para envio ao webhook
      const payload = [
        {
          fromme: true,
          extra: {
            account: accountId || "testAccount",
            inbox: inboxId || "testInbox",
            isTemplate: isTemplate
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
            // Forçar rolagem após cada mensagem do bot
            if (i === responseData.length - 1 || i % 3 === 0) {
              shouldScrollRef.current = true;
              setTimeout(scrollToBottom, 50);
            }
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

  // Função para verificar se uma URL é uma imagem
  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/.test(url.toLowerCase());
  }

  // Função para verificar se uma URL é um vídeo
  const isVideoUrl = (url: string) => {
    return /\.(mp4|webm|ogg|mov)($|\?)/.test(url.toLowerCase());
  }

  // Componente personalizado para renderizar links
  const CustomLink = ({ href, children }: { href: string, children: React.ReactNode }) => {
    if (!href) return <span>{children}</span>;
    
    // Se for uma URL de imagem
    if (isImageUrl(href)) {
      return (
        <div className="my-2 max-w-full">
          <div className="relative rounded-lg overflow-hidden bg-muted/30">
            <img 
              src={href} 
              alt={typeof children === 'string' ? children : 'Imagem'} 
              className="max-w-full h-auto rounded-lg object-contain"
              style={{ maxHeight: '200px' }}
              onLoad={scrollToBottom}
            />
          </div>
          {typeof children === 'string' && children !== href && (
            <p className="text-xs text-center mt-1 text-muted-foreground">{children}</p>
          )}
        </div>
      );
    }
    
    // Se for uma URL de vídeo
    if (isVideoUrl(href)) {
      return (
        <div className="my-2 max-w-full">
          <video 
            src={href} 
            controls 
            className="max-w-full rounded-lg" 
            style={{ maxHeight: '200px' }}
            onLoadedData={scrollToBottom}
          >
            Seu navegador não suporta a tag de vídeo.
          </video>
          {typeof children === 'string' && children !== href && (
            <p className="text-xs text-center mt-1 text-muted-foreground">{children}</p>
          )}
        </div>
      );
    }
    
    // Para outros tipos de arquivos
    const fileName = typeof children === 'string' ? children : href.split('/').pop() || 'Arquivo';
    const extension = href.split('.').pop()?.toLowerCase() || '';
    
    // Determinar o ícone com base na extensão
    let FileTypeIcon = FileIcon;
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      FileTypeIcon = FileTextIcon;
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      FileTypeIcon = Film;
    }
    
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 my-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <FileTypeIcon className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-primary underline">{fileName}</span>
      </a>
    );
  };

  // Função para agrupar mensagens do mesmo remetente
  const renderMessages = () => {
    const messageGroups: Array<{
      isUser: boolean;
      messages: Message[];
    }> = [];

    messages.forEach((message) => {
      const lastGroup = messageGroups[messageGroups.length - 1];
      
      if (lastGroup && lastGroup.isUser === message.isUser) {
        lastGroup.messages.push(message);
      } else {
        messageGroups.push({
          isUser: message.isUser,
          messages: [message]
        });
      }
    });

    return messageGroups.map((group, groupIndex) => (
      <div 
        key={`group-${groupIndex}`} 
        className={`flex ${group.isUser ? 'justify-end' : 'justify-start'} mb-1.5`}
      >
        <div className={`flex flex-col ${group.isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
          {group.messages.map((message, messageIndex) => (
            <div
              key={message.id}
              className={`
                px-3 py-1.5 mb-0.5 
                ${group.isUser 
                  ? 'bg-primary text-primary-foreground rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                  : 'bg-muted rounded-tr-lg rounded-br-lg rounded-bl-lg'
                }
                ${messageIndex === 0 ? 'mt-0' : 'mt-0.5'}
                animate-in fade-in-0 slide-in-from-bottom-1 duration-200
              `}
            >
              {message.isUser ? (
                <p className="text-[14px] leading-[19px] whitespace-pre-wrap break-words">{message.text}</p>
              ) : (
                <div className={cn(
                  "text-[14px] leading-[19px] prose-sm max-w-none",
                  "prose-headings:font-semibold prose-headings:text-foreground",
                  "prose-p:leading-[19px] prose-p:my-0.5",
                  "prose-strong:font-bold prose-strong:text-current",
                  "prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/70",
                  "prose-code:text-muted-foreground prose-code:bg-muted/50 prose-code:rounded prose-code:px-1 prose-code:py-0.5",
                  "prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0.5"
                )}>
                  <ReactMarkdown
                    components={{
                      a: (props) => {
                        const { href, children } = props;
                        return href ? <CustomLink href={href} children={children} /> : <>{children}</>;
                      },
                      p: ({ children }) => {
                        return <p className="whitespace-pre-wrap leading-[19px]">{children}</p>;
                      }
                    }}
                  >
                    {processMessageText(message.text)}
                  </ReactMarkdown>
                </div>
              )}
              {messageIndex === group.messages.length - 1 && (
                <p className="text-[11px] opacity-70 mt-0.5 text-right">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-[600px] overflow-hidden rounded-md border">
      {/* Área de mensagens com rolagem */}
      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
          <div className="p-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                <p>Envie uma mensagem para iniciar a conversa com o agente.</p>
              </div>
            ) : (
              renderMessages()
            )}
            {(isLoading || isTyping) && (
              <div className="flex justify-start mb-1.5">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-1.5">
                  <div className="flex space-x-1 items-center h-3">
                    <div className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            {/* Elemento invisível para referência de rolagem */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Botão de rolagem */}
        {showScrollButton && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-lg bg-background hover:bg-background z-10 h-7 w-7"
            onClick={() => {
              shouldScrollRef.current = true;
              scrollToBottom();
            }}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* Área de entrada de texto */}
      <div className="px-6 py-4 border-t flex-shrink-0">
        <div className="flex items-center gap-3">
          <Input
            id="message-input"
            name="message"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="rounded-full text-sm h-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage()
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="rounded-full px-3 h-10 w-10 p-0 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        {helpText && (
          <p className="text-[10px] text-muted-foreground mt-2 text-center opacity-90">
            {helpText}
          </p>
        )}
      </div>
    </div>
  )
} 
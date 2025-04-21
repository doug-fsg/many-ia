'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2, RefreshCw } from 'lucide-react'
import { generateQRCode, verifyConnection, configureWebhook } from '../actions'

interface QRCodeSectionProps {
  userId: string
}

// Função para verificar se uma string base64 é válida
function isValidBase64(str: string): boolean {
  if (!str) return false;
  try {
    // Verificar se a string está no formato correto
    if (str.startsWith('data:image/png;base64,')) {
      str = str.split(',')[1];
    }
    
    // Verificar se é uma string base64 válida
    const regex = /^[A-Za-z0-9+/=]+$/;
    return regex.test(str);
  } catch (error) {
    console.error('Erro ao validar base64:', error);
    return false;
  }
}

// Função para testar se uma imagem pode ser carregada
function testImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(true);
      return;
    }
    
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export function QRCodeSection({ userId }: QRCodeSectionProps) {
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [configuring, setConfiguring] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [connectionToken, setConnectionToken] = useState<string | null>(null)
  const [connectionName, setConnectionName] = useState('')
  const [connectionInfo, setConnectionInfo] = useState<any>(null)
  const [verificationAttempts, setVerificationAttempts] = useState(0)
  const [regenerationAttempts, setRegenerationAttempts] = useState(0)
  const [autoVerificationStarted, setAutoVerificationStarted] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const MAX_VERIFICATION_ATTEMPTS = 3
  const MAX_REGENERATION_ATTEMPTS = 2
  const AUTO_VERIFICATION_DELAY = 25 // 25 segundos

  // Efeito para gerenciar o timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (qrCodeUrl && !connectionInfo && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prevTimer => {
          if (prevTimer <= 1) {
            // Se o timer chega a zero, cancelar o intervalo
            interval && clearInterval(interval);
            // E iniciar a verificação se ainda não foi iniciada
            if (!autoVerificationStarted && !connectionInfo) {
              console.log('Timer expirado, iniciando verificação automática');
              setAutoVerificationStarted(true);
              
              // Dar feedback visual ao usuário
              toast({
                title: 'Verificação automática',
                description: 'Iniciando verificação da conexão...',
              });
              
              // Atrasar a primeira verificação em 3 segundos para dar feedback visual
              setTimeout(() => {
                handleVerifyConnection();
              }, 3000);
            }
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrCodeUrl, timerSeconds, autoVerificationStarted, connectionInfo]);

  // Função para regenerar o QR code automaticamente
  const regenerateQRCode = async () => {
    console.log(`Regenerando QR code automaticamente (tentativa ${regenerationAttempts + 1}/${MAX_REGENERATION_ATTEMPTS})`);
    
    if (regenerationAttempts >= MAX_REGENERATION_ATTEMPTS) {
      console.log('Número máximo de regenerações automáticas atingido');
      toast({
        title: 'Limite de tentativas atingido',
        description: 'Por favor, tente gerar um novo QR code manualmente.',
        variant: 'destructive',
      });
      return;
    }
    
    setRegenerationAttempts(prev => prev + 1);
    setVerificationAttempts(0);
    setAutoVerificationStarted(false);
    setTimerSeconds(0); // Resetar o timer
    
    await handleGenerateQR();
  };

  const handleGenerateQR = async () => {
    if (!connectionName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, forneça um nome para identificar esta conexão.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setQrCodeUrl(null)
    setConnectionToken(null)
    setConnectionInfo(null)
    setVerificationAttempts(0)
    setAutoVerificationStarted(false)
    setTimerSeconds(0) // Resetar o timer

    try {
      console.log('Iniciando geração de QR code para:', connectionName);
      const response = await generateQRCode(userId, connectionName)
      
      if (response.data) {
        // Verificar se temos um QR code válido
        const qrUrl = response.data.qrCodeUrl;
        console.log('QR code recebido, tamanho:', qrUrl?.length || 0);
        
        if (qrUrl && qrUrl.startsWith('data:image/png;base64,') && qrUrl.length > 30) {
          console.log('QR code no formato correto, testando se pode ser renderizado');
          
          // Verificar se a imagem é válida tentando carregá-la
          const isValid = await testImageUrl(qrUrl);
          
          if (isValid) {
            console.log('QR code válido e pode ser renderizado');
            setQrCodeUrl(qrUrl)
            
            // Garantir que o token não tenha espaços extras
            if (response.data.token) {
              const cleanToken = response.data.token.trim();
              console.log('Token armazenado:', cleanToken);
              setConnectionToken(cleanToken)
            } else {
              console.error('Token recebido está vazio ou nulo');
            }
            
            toast({
              title: 'QR Code gerado',
              description: 'Escaneie o QR Code com seu WhatsApp para conectar. Verificação automática em 25 segundos.',
            })

            // Iniciar o timer visual de 25 segundos
            setTimerSeconds(AUTO_VERIFICATION_DELAY);
          } else {
            console.error('QR code não pode ser renderizado como imagem válida');
            // Também armazenar o token para tentativas manuais
            if (response.data.token) {
              setConnectionToken(response.data.token.trim())
            }
            toast({
              title: 'Erro no QR Code',
              description: 'O QR Code recebido não pode ser exibido. Tentando gerar novamente...',
              variant: 'destructive',
            })
            
            // Se o QR code não pode ser renderizado, tenta regenerar automaticamente
            if (regenerationAttempts < MAX_REGENERATION_ATTEMPTS) {
              setTimeout(regenerateQRCode, 2000);
            }
          }
        } else {
          // QR code inválido
          console.error('QR code inválido recebido:', {
            temPrefixo: qrUrl?.startsWith('data:image/png;base64,'),
            tamanho: qrUrl?.length
          });
          
          // Também armazenar o token para tentativas manuais
          if (response.data.token) {
            setConnectionToken(response.data.token.trim())
          }
          toast({
            title: 'Erro no QR Code',
            description: 'QR Code inválido ou corrompido. Tentando gerar novamente...',
            variant: 'destructive',
          })
          
          // Se o QR code é inválido, tenta regenerar automaticamente
          if (regenerationAttempts < MAX_REGENERATION_ATTEMPTS) {
            setTimeout(regenerateQRCode, 2000);
          }
        }
      } else if (response.error) {
        console.error('Erro na resposta:', response.error);
        toast({
          title: 'Erro',
          description: response.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao gerar o QR Code',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyConnection = async () => {
    if (!connectionToken || verifying) {
      console.log('Verificação ignorada - token ausente ou já verificando');
      return;
    }
    
    try {
      console.log(`Verificando conexão (tentativa ${verificationAttempts + 1}/${MAX_VERIFICATION_ATTEMPTS})`);
      console.log(`TOKEN USADO NA VERIFICAÇÃO: "${connectionToken}"`);
      setVerifying(true);
      setVerificationAttempts((prev) => prev + 1);
      
      // Se for a primeira tentativa de verificação, aguarde um pouco mais para dar
      // tempo ao servidor de processar a conexão
      let delayTime = 0;
      if (verificationAttempts === 0) {
        // Na primeira tentativa, esperamos mais tempo
        delayTime = 10000; // 10 segundos
        console.log(`Primeira verificação (${new Date().toISOString()}), aguardando ${delayTime/1000} segundos adicionais...`);
        
        // Atualizar o usuário sobre o que está acontecendo
        toast({
          title: 'Aguardando conexão',
          description: 'Estamos dando tempo para o servidor processar sua conexão...',
        });
        
        await new Promise(resolve => setTimeout(resolve, delayTime));
        console.log(`Delay concluído (${new Date().toISOString()}), prosseguindo com verificação...`);
      } else {
        // Para tentativas subsequentes, esperar menos tempo
        delayTime = 5000; // 5 segundos
        console.log(`Tentativa subsequente (${verificationAttempts + 1}), aguardando ${delayTime/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }
      
      // Verificar a conexão usando a API correta
      console.log(`Iniciando requisição de verificação (${new Date().toISOString()})...`);
      const response = await verifyConnection(connectionToken, connectionName, userId);
      console.log(`Resposta da verificação recebida (${new Date().toISOString()}):`, response);
      
      // Verificar se a resposta está vazia ou incompleta
      const isEmpty = 
        !response.data || 
        !response.data.success;
      
      // Verificar se recebemos uma resposta vazia do servidor
      const isEmptyServerResponse = 
        (response.error && response.error.includes("Servidor retornou uma resposta vazia")) ||
        (response.error && response.error.includes("Resposta do servidor inválida")) ||
        (!response.data && !response.error); // Sem dados e sem erro é considerado vazio
      
      if (response.data && response.data.success && response.data.server?.wid) {
        console.log('Conexão verificada com sucesso:', response.data);
        setConnectionInfo(response.data);
        setVerificationAttempts(0);
        setRegenerationAttempts(0);
        
        toast({
          title: 'Conexão verificada',
          description: `Seu WhatsApp (${response.data.phoneNumber || response.data.server.wid.split(':')[0]}) foi conectado com sucesso.`,
        });
        
        // Já não configura o webhook automaticamente
        // A conexão estará disponível para ser vinculada a uma IA na tela da IA
        
        return;
      } else if (isEmptyServerResponse) {
        // Se a resposta do servidor vier vazia, regeneramos o QR code automaticamente
        console.log('Resposta vazia do servidor, regenerando QR code...');
        toast({
          title: 'Falha na conexão',
          description: 'Não foi possível verificar a conexão. Gerando um novo QR code...',
          variant: 'destructive',
        });
        
        setTimeout(regenerateQRCode, 1000);
      } else {
        console.log('Conexão ainda não estabelecida:', isEmpty ? 'Resposta vazia ou incompleta' : (response.error || 'Aguardando...'));
        
        // Se excedeu o número máximo de tentativas de verificação
        if (verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
          console.log('Número máximo de tentativas de verificação excedido');
          
          // Tentar regenerar o QR code automaticamente se ainda não atingiu o limite
          if (regenerationAttempts < MAX_REGENERATION_ATTEMPTS) {
            toast({
              title: 'Tentando novamente',
              description: 'Gerando um novo QR code automaticamente...',
            });
            setTimeout(regenerateQRCode, 1000);
          } else {
            toast({
              title: 'Limite de tentativas excedido',
              description: 'Por favor, tente gerar um novo QR code manualmente.',
              variant: 'destructive',
            });
            
            resetAndGenerateNew();
          }
        } else {
          // Se ainda não excedeu, mostrar mensagem e continuar tentando
          toast({
            title: `Verificação em andamento`,
            description: `Aguardando conexão... (${verificationAttempts}/${MAX_VERIFICATION_ATTEMPTS})`,
            variant: 'default',
          });
          
          // Se for verificação automática, tentar novamente após um intervalo maior
          if (autoVerificationStarted && verificationAttempts < MAX_VERIFICATION_ATTEMPTS) {
            // Aumente o intervalo entre as tentativas para dar tempo ao servidor
            const nextRetryTime = 15000; // 15 segundos fixos entre tentativas
            console.log(`Agendando nova tentativa em ${nextRetryTime/1000} segundos (${new Date(Date.now() + nextRetryTime).toISOString()})`);
            setTimeout(() => {
              if (!connectionInfo) {
                handleVerifyConnection();
              }
            }, nextRetryTime);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      
      if (verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        if (regenerationAttempts < MAX_REGENERATION_ATTEMPTS) {
          regenerateQRCode();
        } else {
          toast({
            title: 'Limite de tentativas excedido',
            description: 'Por favor, tente gerar um novo QR code manualmente.',
            variant: 'destructive',
          });
          
          resetAndGenerateNew();
        }
      } else if (autoVerificationStarted) {
        // Tentar novamente automaticamente após um intervalo maior
        const nextRetryTime = 15000; // 15 segundos
        console.log(`Erro na verificação, tentando novamente em ${nextRetryTime/1000} segundos`);
        setTimeout(() => {
          if (!connectionInfo) {
            handleVerifyConnection();
          }
        }, nextRetryTime);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleConfigureWebhook = async () => {
    if (!connectionToken || !connectionInfo) {
      toast({
        title: 'Erro',
        description: 'A conexão precisa ser verificada primeiro',
        variant: 'destructive',
      })
      return
    }

    setConfiguring(true)

    try {
      const response = await configureWebhook(connectionToken, userId)
      
      if (response.data) {
        toast({
          title: 'Configuração concluída',
          description: 'O webhook foi configurado com sucesso.',
        })
        
        // Limpar o estado para permitir uma nova conexão
        resetAndGenerateNew();
        setConnectionName('');
        setConnectionInfo(null);
      } else if (response.error) {
        toast({
          title: 'Erro na configuração',
          description: response.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao configurar o webhook',
        variant: 'destructive',
      })
    } finally {
      setConfiguring(false)
    }
  }

  // Função para resetar o estado e iniciar um novo processo
  const resetAndGenerateNew = () => {
    setQrCodeUrl(null);
    setConnectionToken(null);
    setVerificationAttempts(0);
    setRegenerationAttempts(0);
    setAutoVerificationStarted(false);
    setTimerSeconds(0);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar nova conexão</CardTitle>
        <CardDescription>
          Conecte um novo número de WhatsApp para ser atendido pela IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="connection-name">Nome da conexão</Label>
          <Input
            id="connection-name"
            placeholder="Ex: WhatsApp Atendimento"
            value={connectionName}
            onChange={(e) => setConnectionName(e.target.value)}
            disabled={loading || !!qrCodeUrl}
          />
          <p className="text-xs text-muted-foreground">
            Este nome será usado para identificar esta conexão no sistema.
          </p>
        </div>

        {qrCodeUrl && (
          <div className="mt-6 p-4 border rounded-md flex flex-col items-center">
            <h3 className="text-sm font-medium mb-3">Escaneie o QR Code</h3>
            {timerSeconds > 0 && (
              <div className="mb-2 flex items-center justify-center">
                <div className="relative h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(timerSeconds / AUTO_VERIFICATION_DELAY) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-muted-foreground min-w-10 text-center">
                  {timerSeconds}s
                </span>
              </div>
            )}
            <div className="relative w-64 h-64 mb-4">
              <Image
                src={qrCodeUrl}
                alt="QR Code para conexão do WhatsApp"
                fill
                className="object-contain"
                onError={() => {
                  // Quando a imagem falhar ao carregar
                  console.error('Erro ao carregar imagem do QR code');
                  toast({
                    title: 'Erro na imagem do QR Code',
                    description: 'O QR Code está corrompido ou inválido. Tente gerar um novo.',
                    variant: 'destructive',
                  });
                  // Limpa o QR code atual para permitir gerar outro
                  setQrCodeUrl(null);
                  setTimerSeconds(0);
                }}
                priority={true} // Dá prioridade para carregar esta imagem
                unoptimized={true} // Desativa a otimização para evitar problemas com base64
              />
            </div>
            <div className="w-full text-center">
              <p className="text-xs text-center text-muted-foreground mb-2">
                Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                onClick={() => {
                  console.log('Gerando novo QR code após solicitação do usuário');
                  resetAndGenerateNew();
                  handleGenerateQR();
                }}
              >
                Gerar novo QR Code
              </Button>
            </div>
          </div>
        )}

        {connectionInfo && (
          <div className="mt-4 p-4 border rounded-md space-y-2 bg-slate-50">
            <h4 className="font-medium">Informações da conexão</h4>
            {(connectionInfo.server?.wid || connectionInfo.phoneNumber) && (
              <div className="flex flex-col">
                <p className="text-sm">Número conectado: 
                  <span className="font-medium ml-1">
                    {connectionInfo.phoneNumber || (connectionInfo.server?.wid ? connectionInfo.server.wid.split(':')[0] : 'Desconhecido')}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Este número será usado para receber e enviar mensagens através da IA.
                </p>
              </div>
            )}
            {connectionInfo.dbId && (
              <p className="text-sm">ID da conexão: <span className="font-medium text-xs text-muted-foreground">{connectionInfo.dbId}</span></p>
            )}
            <p className="text-sm text-green-600 font-medium">
              {connectionInfo.success ? 'Conexão bem-sucedida!' : 'Conexão pendente'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 justify-end">
        {!qrCodeUrl ? (
          <Button 
            onClick={handleGenerateQR} 
            disabled={loading || !connectionName.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar QR Code'
            )}
          </Button>
        ) : !connectionInfo ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={resetAndGenerateNew}
              disabled={verifying}
            >
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={handleVerifyConnection}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verificar conexão
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleConfigureWebhook}
            disabled={configuring}
          >
            {configuring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configurando...
              </>
            ) : (
              'Finalizar configuração'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 
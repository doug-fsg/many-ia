'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, RefreshCw, QrCode, Check, AlertCircle } from 'lucide-react'
import { generateQRCode, verifyConnection, configureWebhook } from '../actions'

interface QRCodeModalProps {
  userId: string
  trigger?: React.ReactNode
  onConnectionSuccess?: () => void
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

export function QRCodeModal({ userId, trigger, onConnectionSuccess }: QRCodeModalProps) {
  const [open, setOpen] = useState(false)
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
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error' | 'warning',
    title: string,
    message: string
  } | null>(null)
  
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
              setStatusMessage({
                type: 'loading',
                title: 'Verificação automática',
                message: 'Iniciando verificação da conexão...'
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

  // Efeito para fechar o modal quando a conexão for bem-sucedida
  useEffect(() => {
    if (connectionInfo && connectionInfo.success) {
      // Aguardar um pouco para o usuário ver a mensagem de sucesso
      const timer = setTimeout(() => {
        if (onConnectionSuccess) {
          onConnectionSuccess();
        }
        setOpen(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionInfo, onConnectionSuccess]);

  // Função para regenerar o QR code automaticamente
  const regenerateQRCode = async () => {
    console.log(`Regenerando QR code automaticamente (tentativa ${regenerationAttempts + 1}/${MAX_REGENERATION_ATTEMPTS})`);
    
    if (regenerationAttempts >= MAX_REGENERATION_ATTEMPTS) {
      console.log('Número máximo de regenerações automáticas atingido');
      setStatusMessage({
        type: 'error',
        title: 'Limite de tentativas atingido',
        message: 'Por favor, tente gerar um novo QR code.'
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
      setStatusMessage({
        type: 'error',
        title: 'Nome obrigatório',
        message: 'Por favor, forneça um nome para identificar esta conexão.'
      });
      return;
    }

    setLoading(true);
    setQrCodeUrl(null);
    setConnectionToken(null);
    setConnectionInfo(null);
    setVerificationAttempts(0);
    setAutoVerificationStarted(false);
    setTimerSeconds(0);
    setStatusMessage({
      type: 'loading',
      title: 'Gerando QR Code',
      message: 'Aguarde enquanto geramos o QR Code para conexão...'
    });

    try {
      console.log('Iniciando geração de QR code para:', connectionName);
      const response = await generateQRCode(userId, connectionName);
      
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
            setQrCodeUrl(qrUrl);
            
            // Garantir que o token não tenha espaços extras
            if (response.data.token) {
              const cleanToken = response.data.token.trim();
              console.log('Token armazenado:', cleanToken);
              setConnectionToken(cleanToken);
            } else {
              console.error('Token recebido está vazio ou nulo');
            }
            
            setStatusMessage({
              type: 'idle',
              title: 'QR Code gerado',
              message: 'Escaneie o QR Code com seu WhatsApp para conectar.'
            });

            // Iniciar o timer visual de 25 segundos
            setTimerSeconds(AUTO_VERIFICATION_DELAY);
          } else {
            console.error('QR code não pode ser renderizado como imagem válida');
            // Também armazenar o token para tentativas manuais
            if (response.data.token) {
              setConnectionToken(response.data.token.trim());
            }
            setStatusMessage({
              type: 'error',
              title: 'Erro no QR Code',
              message: 'O QR Code recebido não pode ser exibido. Tentando gerar novamente...'
            });
            
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
            setConnectionToken(response.data.token.trim());
          }
          setStatusMessage({
            type: 'error',
            title: 'Erro no QR Code',
            message: 'QR Code inválido ou corrompido. Tentando gerar novamente...'
          });
          
          // Se o QR code é inválido, tenta regenerar automaticamente
          if (regenerationAttempts < MAX_REGENERATION_ATTEMPTS) {
            setTimeout(regenerateQRCode, 2000);
          }
        }
      } else if (response.error) {
        console.error('Erro na resposta:', response.error);
        setStatusMessage({
          type: 'error',
          title: 'Erro',
          message: response.error
        });
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      setStatusMessage({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao gerar o QR Code'
      });
    } finally {
      setLoading(false);
    }
  };

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
        setStatusMessage({
          type: 'loading',
          title: 'Aguardando conexão',
          message: 'Estamos dando tempo para o servidor processar sua conexão...'
        });
        
        await new Promise(resolve => setTimeout(resolve, delayTime));
        console.log(`Delay concluído (${new Date().toISOString()}), prosseguindo com verificação...`);
      } else {
        // Para tentativas subsequentes, esperar menos tempo
        delayTime = 5000; // 5 segundos
        console.log(`Tentativa subsequente (${verificationAttempts + 1}), aguardando ${delayTime/1000} segundos...`);
        setStatusMessage({
          type: 'loading',
          title: 'Verificando',
          message: `Tentativa ${verificationAttempts + 1} de ${MAX_VERIFICATION_ATTEMPTS}...`
        });
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
        
        setStatusMessage({
          type: 'success',
          title: 'Conexão verificada',
          message: `Seu WhatsApp (${response.data.phoneNumber || response.data.server.wid.split(':')[0]}) foi conectado com sucesso.`
        });
        
        // Já não configura o webhook automaticamente
        // A próxima etapa será feita manualmente pelo usuário através da IA
        
        // Aguardar um momento e então fechar o modal
        setTimeout(() => {
          if (onConnectionSuccess) {
            onConnectionSuccess();
          }
          setOpen(false);
        }, 2000);
        
        return;
      } else if (isEmptyServerResponse) {
        // Se a resposta do servidor vier vazia, regeneramos o QR code automaticamente
        console.log('Resposta vazia do servidor, regenerando QR code...');
        setStatusMessage({
          type: 'error',
          title: 'Falha na conexão',
          message: 'Não foi possível verificar a conexão. Gerando um novo QR code...'
        });
        
        setTimeout(regenerateQRCode, 1000);
      } else {
        console.log('Conexão ainda não estabelecida:', isEmpty ? 'Resposta vazia ou incompleta' : (response.error || 'Aguardando...'));
        
        // Se excedeu o número máximo de tentativas de verificação
        if (verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
          console.log('Número máximo de tentativas de verificação excedido');
          
          // Tentar regenerar o QR code automaticamente se ainda não atingiu o limite
          if (regenerationAttempts < MAX_REGENERATION_ATTEMPTS) {
            setStatusMessage({
              type: 'warning',
              title: 'Tentando novamente',
              message: 'Gerando um novo QR code automaticamente...'
            });
            setTimeout(regenerateQRCode, 1000);
          } else {
            setStatusMessage({
              type: 'error',
              title: 'Limite de tentativas excedido',
              message: 'Por favor, tente gerar um novo QR code manualmente.'
            });
            
            resetAndGenerateNew();
          }
        } else {
          // Se ainda não excedeu, mostrar mensagem e continuar tentando
          setStatusMessage({
            type: 'loading',
            title: `Verificação em andamento`,
            message: `Aguardando conexão... (${verificationAttempts}/${MAX_VERIFICATION_ATTEMPTS})`
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
          setStatusMessage({
            type: 'error',
            title: 'Limite de tentativas excedido',
            message: 'Por favor, tente gerar um novo QR code manualmente.'
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

  // Manter a função handleConfigureWebhook, mas ela não será chamada automaticamente
  // Agora será chamada explicitamente pelo usuário através do componente de vinculação de canal
  const handleConfigureWebhook = async () => {
    if (!connectionToken || !connectionInfo) {
      setStatusMessage({
        type: 'error',
        title: 'Erro',
        message: 'A conexão precisa ser verificada primeiro'
      });
      return;
    }

    setConfiguring(true);
    setStatusMessage({
      type: 'loading',
      title: 'Configurando webhook',
      message: 'Finalizando a configuração do webhook...'
    });

    try {
      const response = await configureWebhook(connectionToken, userId);
      
      if (response.data) {
        setStatusMessage({
          type: 'success',
          title: 'Configuração concluída',
          message: 'O webhook foi configurado com sucesso.'
        });
        
        // Aguardar um momento e então fechar o modal
        setTimeout(() => {
          if (onConnectionSuccess) {
            onConnectionSuccess();
          }
          setOpen(false);
        }, 2000);
      } else if (response.error) {
        setStatusMessage({
          type: 'error',
          title: 'Erro na configuração',
          message: response.error
        });
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao configurar o webhook'
      });
    } finally {
      setConfiguring(false);
    }
  };

  // Função para resetar o estado e iniciar um novo processo
  const resetAndGenerateNew = () => {
    setQrCodeUrl(null);
    setConnectionToken(null);
    setVerificationAttempts(0);
    setRegenerationAttempts(0);
    setAutoVerificationStarted(false);
    setTimerSeconds(0);
    setStatusMessage(null);
  };

  // Resetar o estado quando o modal for fechado
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetAndGenerateNew();
      setConnectionName('');
      setConnectionInfo(null);
    }
  };

  // Renderizar o status
  const renderStatus = () => {
    if (!statusMessage) return null;
    
    const icons = {
      idle: null,
      loading: <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
      success: <Check className="mr-2 h-4 w-4" />,
      error: <AlertCircle className="mr-2 h-4 w-4" />,
      warning: <AlertCircle className="mr-2 h-4 w-4" />
    };
    
    const colors = {
      idle: "bg-gray-50 border-gray-200",
      loading: "bg-blue-50 border-blue-200",
      success: "bg-green-50 border-green-200",
      error: "bg-red-50 border-red-200",
      warning: "bg-yellow-50 border-yellow-200"
    };
    
    const textColors = {
      idle: "text-gray-800",
      loading: "text-blue-800",
      success: "text-green-800",
      error: "text-red-800",
      warning: "text-yellow-800"
    };
    
    return (
      <div className={`p-4 rounded-md border ${colors[statusMessage.type]} mt-4`}>
        <div className={`flex items-start ${textColors[statusMessage.type]}`}>
          {icons[statusMessage.type]}
          <div>
            <p className="font-medium">{statusMessage.title}</p>
            <p className="text-sm mt-1">{statusMessage.message}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar conexão WhatsApp</DialogTitle>
          <DialogDescription>
            Conecte um novo número de WhatsApp para atendimento automatizado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!qrCodeUrl ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connection-name">Nome da conexão</Label>
                <Input
                  id="connection-name"
                  placeholder="Ex: WhatsApp Atendimento"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Este nome será usado para identificar esta conexão no sistema.
                </p>
              </div>
              
              {renderStatus()}
              
              <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
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
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Gerar QR Code
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : !connectionInfo ? (
            <div className="space-y-4">
              {renderStatus()}
              
              <div className="flex flex-col items-center">
                {timerSeconds > 0 && (
                  <div className="w-full mb-2 flex items-center justify-center">
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
                      console.error('Erro ao carregar imagem do QR code');
                      setStatusMessage({
                        type: 'error',
                        title: 'Erro na imagem do QR Code',
                        message: 'O QR Code está corrompido ou inválido. Tente gerar um novo.'
                      });
                      setQrCodeUrl(null);
                      setTimerSeconds(0);
                    }}
                    priority={true}
                    unoptimized={true}
                  />
                </div>
                
                <p className="text-xs text-center text-muted-foreground mb-2">
                  Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho
                </p>
              </div>
              
              <DialogFooter className="sm:justify-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={resetAndGenerateNew}
                  disabled={verifying}
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleVerifyConnection}
                  disabled={verifying}
                  size="sm"
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
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {renderStatus()}
              
              <div className="p-4 border rounded-md space-y-2 bg-slate-50">
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
              </div>
              
              <DialogFooter>
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
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
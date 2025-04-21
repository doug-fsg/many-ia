'use client'

import { useRef, useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { WhatsAppConnectionsList, ConnectionsListRef } from './_components/connections-list'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { QRCodeModal } from './_components/qrcode-modal'

interface WhatsAppPageProps {
  userId: string | undefined
  isIntegrationUser: boolean
}

export default function WhatsAppClient({ userId, isIntegrationUser }: WhatsAppPageProps) {
  // Ref para acessar o método de recarregamento da lista de conexões
  const connectionsListRef = useRef<ConnectionsListRef>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  // Verificar se o usuário está autenticado
  if (!userId) {
    console.log('[WHATSAPP-CLIENT] Usuário não autenticado, redirecionando para /auth');
    redirect('/auth')
  }
  
  // Verificação adicional para usuários de integração
  useEffect(() => {
    const verifyAccessRights = async () => {
      try {
        setIsVerifying(true);
        
        // Verificar diretamente com a API para ter certeza
        const response = await fetch('/api/user/info');
        const data = await response.json();
        
        console.log('[WHATSAPP-CLIENT] Verificação de acesso:', {
          propsIsIntegrationUser: isIntegrationUser,
          apiIsIntegrationUser: data.isIntegrationUser,
          userId: userId,
          apiUserId: data.id
        });
        
        // Se for usuário de integração pela API, redirecionar
        if (data.isIntegrationUser) {
          console.log('[WHATSAPP-CLIENT] Acesso negado para usuário de integração via API');
          window.location.href = '/app/settings';
          return;
        }
        
        setIsVerifying(false);
      } catch (error) {
        console.error('[WHATSAPP-CLIENT] Erro ao verificar direitos de acesso:', error);
        // Em caso de erro, confiar no parâmetro isIntegrationUser
        if (isIntegrationUser) {
          console.log('[WHATSAPP-CLIENT] Acesso negado para usuário de integração via props');
          window.location.href = '/app/settings';
        }
        setIsVerifying(false);
      }
    };
    
    verifyAccessRights();
  }, [userId, isIntegrationUser]);
  
  // Verificar se o usuário é da integração pelos parâmetros recebidos
  if (isIntegrationUser) {
    console.log('[WHATSAPP-CLIENT] Usuário de integração detectado nos parâmetros, redirecionando');
    redirect('/app/settings')
  }
  
  // Função para recarregar as conexões quando uma nova for adicionada
  const handleConnectionSuccess = () => {
    if (connectionsListRef.current) {
      setTimeout(() => {
        connectionsListRef.current?.loadConnections();
      }, 1000);
    }
  };
  
  // Mostrar carregamento enquanto verifica
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Conexões do WhatsApp</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie suas conexões do WhatsApp para que a IA possa atendê-las.
          </p>
        </div>
        
        <QRCodeModal 
          userId={userId} 
          trigger={
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Conexão
            </Button>
          } 
          onConnectionSuccess={handleConnectionSuccess}
        />
      </div>
      
      <div className="space-y-6">
        <WhatsAppConnectionsList userId={userId} ref={connectionsListRef} />
      </div>
    </div>
  )
} 
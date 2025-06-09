'use client'

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LockKeyhole } from 'lucide-react';

interface SubscriptionRequiredClientProps {
  title: string;
  description: string;
}

export async function createCheckoutSession() {
  try {
    // Obter a URL atual para ser usada como URL de cancelamento
    const currentUrl = window.location.href;
    
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelUrl: currentUrl
      }),
    });
    
    const data = await response.json();
    
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('URL de checkout não encontrada');
    }
  } catch (error) {
    console.error('Erro ao iniciar checkout:', error);
    alert('Erro ao iniciar o processo de pagamento. Por favor, tente novamente.');
  }
}

export function SubscriptionRequiredClient({ title, description }: SubscriptionRequiredClientProps) {
  return (
    <div className="flex items-center justify-center h-full w-full p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <LockKeyhole className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Para acessar este recurso, você precisa assinar um plano. Como afiliado, você receberá comissões por cada venda, mas para utilizar todas as funcionalidades é necessário ter uma assinatura ativa.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            onClick={() => createCheckoutSession()}
          >
            Assinar Agora
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
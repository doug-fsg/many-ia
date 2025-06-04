import { NextResponse } from 'next/server';
import { createDirectCheckoutSession } from '@/services/stripe';

export async function POST(req: Request) {
  try {
    // Extrair a URL de cancelamento do corpo da requisição
    const body = await req.json();
    const { cancelUrl } = body;
    
    const checkoutSession = await createDirectCheckoutSession(cancelUrl);
    
    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: 'Erro ao criar sessão de checkout' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Erro na rota de checkout:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 
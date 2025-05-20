import { NextResponse } from 'next/server';
import { createDirectCheckoutSession } from '@/services/stripe';

export async function POST() {
  try {
    const checkoutSession = await createDirectCheckoutSession();
    
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
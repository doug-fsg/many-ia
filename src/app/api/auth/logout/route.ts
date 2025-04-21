import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/services/database';

export async function POST() {
  try {
    // Obter o token do cookie personalizado
    const authJsToken = cookies().get('authjs.session-token')?.value;
    
    if (authJsToken) {
      // Remover a sessão do banco de dados
      await prisma.session.deleteMany({
        where: {
          sessionToken: authJsToken
        }
      });
      
      // Limpar o cookie
      cookies().delete('authjs.session-token');
    }
    
    // Limpar outros cookies relacionados à autenticação
    cookies().delete('next-auth.session-token');
    cookies().delete('next-auth.callback-url');
    
    return NextResponse.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao realizar logout:', error);
    return NextResponse.json(
      { error: 'Erro ao realizar logout' },
      { status: 500 }
    );
  }
} 
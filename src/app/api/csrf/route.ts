import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

// Configuração para marcar a rota como dinâmica
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verificar se já existe um token CSRF
    const cookieStore = cookies();
    const existingCsrfToken = cookieStore.get('next-auth.csrf-token');
    
    if (existingCsrfToken) {
      // Extrair o token do cookie (formato: token|hash)
      const token = existingCsrfToken.value.split('|')[0];
      return NextResponse.json({ csrfToken: token });
    }
    
    // Criar um novo token CSRF
    const csrfToken = randomBytes(32).toString('hex');
    
    // Normalmente, NextAuth cuidaria disso, mas estamos fornecendo manualmente
    // para casos onde precisamos garantir que o token esteja disponível
    return NextResponse.json(
      { csrfToken },
      {
        headers: {
          'Set-Cookie': `next-auth.csrf-token=${csrfToken}|${randomBytes(32).toString('hex')}; Path=/; HttpOnly; SameSite=Lax;`,
        },
      }
    );
  } catch (error) {
    console.error('Erro ao gerar token CSRF:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
} 
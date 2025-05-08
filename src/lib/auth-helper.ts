import { cookies } from 'next/headers';
import { auth } from '@/services/auth';
import { prisma } from '@/services/database';

export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    // Verificar se estamos em ambiente de build/estático
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
      // Durante o build estático, retornar null para evitar erros
      console.log('Ambiente de build detectado, pulando verificação de autenticação');
      return null;
    }

    // Verificar cookie personalizado primeiro
    let cookieStore;
    try {
      cookieStore = cookies();
    } catch (error) {
      console.error('Erro ao acessar cookies:', error);
      // Se não conseguir acessar cookies, tenta apenas via NextAuth
      const nextAuthSession = await auth();
      if (nextAuthSession?.user) {
        return {
          id: nextAuthSession.user.id as string,
          name: nextAuthSession.user.name,
          email: nextAuthSession.user.email,
          image: nextAuthSession.user.image
        };
      }
      return null;
    }
    
    const authJsToken = cookieStore.get('authjs.session-token')?.value;
    
    if (authJsToken) {
      // Buscar sessão pelo token personalizado
      const session = await prisma.session.findFirst({
        where: {
          sessionToken: authJsToken,
          expires: { gt: new Date() }
        },
        include: { user: true }
      });
      
      if (session?.user) {
        return {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image
        };
      }
    }
    
    // Se não encontrou usuário via cookie personalizado, tenta via NextAuth
    const nextAuthSession = await auth();
    if (nextAuthSession?.user) {
      return {
        id: nextAuthSession.user.id as string,
        name: nextAuthSession.user.name,
        email: nextAuthSession.user.email,
        image: nextAuthSession.user.image
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao obter usuário autenticado:', error);
    return null;
  }
} 
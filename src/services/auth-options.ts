import NextAuth, { DefaultSession, Account, Profile } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcrypt'
import { JWT } from 'next-auth/jwt'
import { User } from '@prisma/client'
import { cookies } from 'next/headers'

import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './database'
import { createStripeCustomer } from './stripe'

// Extend the built-in session types
interface ExtendedSession extends DefaultSession {
  user?: User & {
    isIntegrationUser: boolean;
  }
}

// Extend the built-in request types
interface ExtendedRequest {
  headers: {
    cookie?: string;
  };
}

export const authOptions = {
  debug: false,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000'),
  pages: {
    signIn: '/auth',
    signOut: '/auth',
    error: '/auth',
    verifyRequest: '/auth',
    newUser: '/app',
  },
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials: Record<string, string> | undefined, req: ExtendedRequest) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Verificar se temos cookie de integração do header Cookie
        let integrationUserId = null;
        if (req?.headers?.cookie) {
          const cookieString = req.headers.cookie;
          const cookies = cookieString.split(';');
          const integrationCookie = cookies.find(c => c.trim().startsWith('next-auth.integration-user='));
          if (integrationCookie) {
            integrationUserId = integrationCookie.split('=')[1]?.trim();
          }
        }
        
        if (integrationUserId) {
          const user = await prisma.user.findUnique({
            where: { id: integrationUserId }
          });
          
          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              isIntegrationUser: user.isIntegrationUser
            };
          }
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string
            }
          })

          if (!user) {
            throw new Error('USER_NOT_FOUND')
          }

          if (!user.password) {
            throw new Error('PASSWORD_NOT_SET')
          }

          const passwordMatch = await compare(credentials.password as string, user.password)

          if (!passwordMatch) {
            throw new Error('INVALID_PASSWORD')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            isIntegrationUser: user.isIntegrationUser
          }
        } catch (error) {
          console.error('[AUTH] Erro na autenticação:', error)
          // Propaga o erro para ser tratado no frontend
          throw error
        }
      }
    }),
    // Provider personalizado para SSO via /api/many
    CredentialsProvider({
      id: 'sso-many',
      name: 'SSO Many Integration',
      credentials: {
        ssoToken: { label: "SSO Token", type: "text" },
        userId: { label: "User ID", type: "text" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.ssoToken || !credentials?.userId) {
            console.error('SSO-MANY: Credenciais incompletas');
            return null;
          }
          
          // Verificar se o token é válido
          const verificationToken = await prisma.verificationToken.findFirst({
            where: {
              identifier: credentials.userId as string,
              token: credentials.ssoToken as string,
              expires: {
                gt: new Date()
              }
            }
          });
          
          if (!verificationToken) {
            console.error('SSO-MANY: Token inválido ou expirado');
            return null;
          }
          
          // Buscar usuário
          const user = await prisma.user.findUnique({
            where: { id: credentials.userId as string }
          });
          
          if (!user) {
            console.error('SSO-MANY: Usuário não encontrado');
            return null;
          }
          
          // IMPORTANTE: Marcar o token como usado em vez de excluí-lo imediatamente
          // Isso evita problemas com múltiplas tentativas de autenticação em paralelo
          // Agora permitimos que o mesmo token seja usado por até 10 segundos para lidar com race conditions
          const tokenUseTimestamp = verificationToken.identifier + ':' + verificationToken.token + ':used';
          const tokenAlreadyUsed = await prisma.session.findFirst({
            where: { sessionToken: tokenUseTimestamp }
          });
          
          // Se o token já foi usado recentemente, continuamos permitindo
          // Isso resolve a race condition onde NextAuth faz múltiplas verificações
          if (!tokenAlreadyUsed) {
            // Marcar o token como usado através de uma sessão especial temporária
            await prisma.session.create({
              data: {
                id: crypto.randomUUID(), 
                sessionToken: tokenUseTimestamp,
                userId: credentials.userId as string,
                expires: new Date(Date.now() + 10000) // 10 segundos
              }
            });
          } else {
            console.log('SSO-MANY: Reuso de token dentro da janela de tempo permitida');
          }
          
          console.log('SSO-MANY: Login bem-sucedido para', user.email);
          
          // Agendar a remoção do token para evitar lixo no banco (após 30 segundos)
          setTimeout(async () => {
            try {
              // Remover o token de verificação
              await prisma.verificationToken.deleteMany({
                where: { 
                  token: credentials.ssoToken as string
                }
              });
              
              // Remover também a marca de uso
              await prisma.session.deleteMany({
                where: {
                  sessionToken: tokenUseTimestamp,
                  expires: { lt: new Date() }
                }
              });
            } catch (err) {
              // Falha silenciosa é aceitável aqui
              console.log('Falha ao limpar token expirado:', err);
            }
          }, 30000);
          
          // Retornar o usuário para autenticação
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            isIntegrationUser: true
          };
        } catch (error) {
          console.error('SSO-MANY: Erro na autenticação', error);
          return null;
        }
      }
    })
  ],
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    }
  },
  callbacks: {
    signIn: async ({ user, account }: { user: User; account: Account | null }) => {
      return true
    },
    
    redirect: async ({ url, baseUrl }: { url: string; baseUrl: string }) => {
      // Verificar se existe cookie de redirecionamento de integração
      const cookies = (typeof window !== 'undefined' ? document.cookie : '') || '';
      const redirectMatch = cookies.match(/next-auth\.integration-redirect=([^;]+)/);
      
      if (redirectMatch && redirectMatch[1]) {
        // Limpar o cookie de redirecionamento
        if (typeof window !== 'undefined') {
          document.cookie = 'next-auth.integration-redirect=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          document.cookie = 'next-auth.integration-user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
        return redirectMatch[1];
      }
      
      // Usar NEXT_PUBLIC_APP_URL se disponível, caso contrário usar baseUrl
      const effectiveBaseUrl = process.env.NEXT_PUBLIC_APP_URL || baseUrl;
      
      // Se a URL já começa com a base efetiva, use-a diretamente
      if (url.startsWith(effectiveBaseUrl)) {
        return url;
      }
      
      // Se a URL é um caminho absoluto (começa com /), anexe-o à base
      if (url.startsWith('/')) {
        return `${effectiveBaseUrl}${url}`;
      }
      
      // Caso padrão: redirecionar para /app
      return `${effectiveBaseUrl}/app`;
    },
    
    session: async ({ session, user, token }: { 
      session: ExtendedSession; 
      user: User | null; 
      token: JWT | null;
    }) => {
      if (session?.user) {
        if (user) {
          session.user.id = user.id;
          session.user.isIntegrationUser = (user as any).isIntegrationUser ?? false;
        } else if (token) {
          session.user.id = token.id as string;
          
          const isIntegrationFromToken = typeof token.isIntegrationUser === 'boolean' 
            ? token.isIntegrationUser 
            : false;
            
          session.user.isIntegrationUser = isIntegrationFromToken;
        }
      }
      
      if (session?.user?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id }
          });
          
          if (dbUser && typeof dbUser.isIntegrationUser === 'boolean') {
            session.user.isIntegrationUser = dbUser.isIntegrationUser;
          }
        } catch (error) {
          // Silently fail and keep the current session state
        }
      }
      
      return session;
    },
    jwt: async ({ token, user }: { token: JWT; user: User | null }) => {
      if (user) {
        token.id = user.id;
        token.isIntegrationUser = (user as any).isIntegrationUser ?? false;
      }
      return token;
    }
  },
  events: {
    createUser: async ({ user }) => {
      console.log('[REFERRAL] Iniciando evento createUser para:', user.email)
      // Criar cliente Stripe
      await createStripeCustomer({
        name: user.name as string,
        email: user.email as string,
      })

      // Processar código de afiliado se existir
      try {
        const cookieStore = cookies()
        const affiliateRef = cookieStore.get('affiliate_ref')?.value
        console.log('[REFERRAL] Cookie affiliate_ref encontrado:', affiliateRef || 'não encontrado')

        if (affiliateRef) {
          // Encontrar o afiliado pelo código
          const affiliate = await prisma.affiliate.findFirst({
            where: { referralCode: affiliateRef }
          })
          
          console.log('[REFERRAL] Afiliado encontrado:', affiliate?.id || 'não encontrado')

          if (affiliate) {
            // Criar referência
            await prisma.referral.create({
              data: {
                affiliateId: affiliate.id,
                referredUserId: user.id,
                status: 'pending'
              }
            })
            
            console.log(`[REFERRAL] Referência criada com sucesso: ${affiliate.id} → ${user.id}`)
          }
        }
      } catch (error) {
        console.error("[REFERRAL] Erro ao processar referência:", error)
      }
    },
    signIn: async () => {},
    signOut: async () => {},
    session: async () => {},
  },
} 
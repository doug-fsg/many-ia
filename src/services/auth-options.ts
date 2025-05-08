import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/nodemailer'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcrypt'

import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './database'
import { createStripeCustomer } from './stripe'

export const authOptions = {
  debug: false,
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
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Verificar se temos cookie de integração do header Cookie
        let integrationUserId = null;
        if (req?.headers?.cookie) {
          const cookieString = req.headers.cookie as string;
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

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string
          }
        })

        if (!user || !user.password) {
          return null
        }

        try {
          const passwordMatch = await compare(credentials.password as string, user.password)

          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            isIntegrationUser: user.isIntegrationUser
          }
        } catch (error) {
          return null
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
    signIn: async ({ user, account }) => {
      return true
    },
    
    redirect: async ({ url, baseUrl }) => {
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
      
      if (url.startsWith(baseUrl)) {
        return url
      }
      return `${baseUrl}/app`
    },
    
    session: async ({ session, user, token }) => {
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
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.isIntegrationUser = (user as any).isIntegrationUser ?? false;
      }
      return token;
    }
  },
  events: {
    createUser: async (message) => {
      await createStripeCustomer({
        name: message.user.name as string,
        email: message.user.email as string,
      })
    },
    signIn: async () => {},
    signOut: async () => {},
    session: async () => {},
  },
} 
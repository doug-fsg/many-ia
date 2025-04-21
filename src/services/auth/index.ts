import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/nodemailer'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcrypt'

import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '../database'
import { createStripeCustomer } from '../stripe'

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
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
    strategy: "jwt",
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
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
    })
  ],
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
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
})

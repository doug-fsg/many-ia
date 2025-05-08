import NextAuth from 'next-auth'
import { authOptions } from '../auth-options'
import EmailProvider from 'next-auth/providers/nodemailer'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcrypt'

import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '../database'
import { createStripeCustomer } from '../stripe'

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth(authOptions)

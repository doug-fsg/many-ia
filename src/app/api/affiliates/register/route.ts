import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/services/database'
import { stripe } from '@/services/stripe'

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().min(50),
  termsAccepted: z.literal(true),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    // Verificar se o email já está cadastrado
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      include: { affiliate: true },
    })

    if (existingUser?.affiliate) {
      return NextResponse.json(
        { error: 'Email já cadastrado como afiliado' },
        { status: 400 }
      )
    }

    // Criar ou atualizar usuário
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
      },
      create: {
        email: data.email,
        name: data.name,
      },
    })

    // Criar conta Stripe Connect
    const stripeAccount = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email: data.email,
      business_type: 'individual',
      capabilities: {
        transfers: { requested: true },
      },
    })

    // Criar registro de afiliado
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: user.id,
        stripeConnectAccountId: stripeAccount.id,
        status: 'pending',
      },
    })

    // Criar link de onboarding do Stripe Connect
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate-program/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate-program/onboarding/success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      accountLink: accountLink.url,
    })
  } catch (error) {
    console.error('Erro ao registrar afiliado:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
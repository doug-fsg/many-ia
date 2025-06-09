import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import { prisma } from '@/services/database'
import { stripe } from '@/services/stripe'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'

// Configurar o transporte de email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'suporteinovechat@gmail.com',
    pass: 'dsknphgnlbgskvso',
  },
})

export async function POST(req: NextRequest) {
  try {
    const { sessionId, password } = await req.json()

    if (!sessionId || !password) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Buscar a sessão do Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Sessão de checkout não encontrada' },
        { status: 404 }
      )
    }

    const customerEmail = checkoutSession.customer_details?.email
    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Email do cliente não encontrado' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email: customerEmail,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Hash da senha
    const hashedPassword = await hash(password, 10)

    // Atualizar o usuário existente com a senha
    const user = await prisma.user.update({
      where: {
        email: customerEmail
      },
      data: {
        password: hashedPassword
      }
    })

    // Gerar token de recuperação
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hora

    // Salvar o token no banco
    await prisma.verificationToken.create({
      data: {
        identifier: customerEmail,
        token,
        expires,
      },
    })

    // Construir a URL de recuperação
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

    // Enviar email com a URL de recuperação
    await transporter.sendMail({
      from: 'suporteinovechat@gmail.com',
      to: customerEmail,
      subject: 'Bem-vindo ao InoveCHAT',
      html: `
        <h1>Bem-vindo ao InoveCHAT!</h1>
        <p>Sua senha foi definida com sucesso.</p>
        <p>Para acessar sua conta, clique no botão abaixo:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Acessar minha conta
        </a>
      `
    })

    // Processar código de afiliado se existir
    const affiliateRef = req.cookies.get('affiliate_ref')?.value
    console.log('[REFERRAL-SETUP] Verificando cookie affiliate_ref:', affiliateRef || 'não encontrado')
    
    if (affiliateRef) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { referralCode: affiliateRef }
      })
      
      console.log('[REFERRAL-SETUP] Afiliado encontrado:', affiliate?.id || 'não encontrado')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao definir senha:', error)
    return NextResponse.json(
      { error: 'Erro ao definir senha' },
      { status: 500 }
    )
  }
} 
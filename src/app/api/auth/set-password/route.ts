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

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email: customerEmail,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      )
    }

    // Hash da senha
    const hashedPassword = await hash(password, 10)

    // Criar o usuário
    const user = await prisma.user.create({
      data: {
        email: customerEmail,
        name: checkoutSession.customer_details?.name,
        password: hashedPassword,
        stripeCustomerId: checkoutSession.customer as string,
        stripeSubscriptionId: checkoutSession.subscription as string,
        stripeSubscriptionStatus: 'active',
        stripePriceId: process.env.STRIPE_PRICE_ID,
      },
    })

    // Processar código de afiliado se existir
    const affiliateRef = req.cookies.get('affiliate_ref')?.value
    if (affiliateRef) {
      console.log(`[SET-PASSWORD] Processando código de afiliado: ${affiliateRef}`)
      
      const affiliate = await prisma.affiliate.findUnique({
        where: { referralCode: affiliateRef }
      })

      if (affiliate) {
        console.log(`[SET-PASSWORD] Afiliado encontrado: ${affiliate.id}`)
        
        // Criar referência
        await prisma.referral.create({
          data: {
            affiliateId: affiliate.id,
            referredUserId: user.id,
            status: 'pending' // Será atualizado para 'active' quando o pagamento for confirmado
          }
        })

        console.log(`[SET-PASSWORD] Referência criada para o usuário ${user.id}`)
      }
    }

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

    // Enviar o email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: 'Link para Redefinição de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bem-vindo!</h2>
          <p>Olá ${checkoutSession.customer_details?.name || ''},</p>
          <p>Sua conta foi criada com sucesso. Guardamos este link para você caso precise redefinir sua senha no futuro:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Redefinir Senha
            </a>
          </p>
          <p>Este link é válido por 1 hora. Se precisar de um novo link depois, você pode solicitá-lo na página de login.</p>
          <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        </div>
      `,
    })

    // Remover a senha do objeto retornado
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { message: 'Senha definida com sucesso', user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao definir senha:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  }
} 
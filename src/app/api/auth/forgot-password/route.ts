import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
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
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Gerar token de recuperação
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hora

    // Salvar o token no banco
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    // Construir a URL de recuperação
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

    // Enviar o email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Recuperação de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Recuperação de Senha</h2>
          <p>Olá,</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Se você não fez esta solicitação, por favor ignore este email.</p>
          <p>Para redefinir sua senha, clique no botão abaixo:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Redefinir Senha
            </a>
          </p>
          <p>Este link é válido por 1 hora.</p>
          <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        </div>
      `,
    })

    return NextResponse.json(
      { message: 'Email de recuperação enviado com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  }
} 
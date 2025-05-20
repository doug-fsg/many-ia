import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { hash } from 'bcrypt'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Buscar e validar o token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    if (verificationToken.expires < new Date()) {
      // Limpar token expirado
      await prisma.verificationToken.delete({
        where: { token },
      })

      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 400 }
      )
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await hash(password, 10)

    // Atualizar a senha do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Limpar o token usado
    await prisma.verificationToken.delete({
      where: { token },
    })

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  }
} 
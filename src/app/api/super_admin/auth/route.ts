import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcrypt'
import { prisma } from '@/services/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário por email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isSuperAdmin: true,
        isIntegrationUser: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verificar se é super admin
    if (!user.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas super administradores podem acessar.' },
        { status: 403 }
      )
    }

    // Verificar se tem senha configurada
    if (!user.password) {
      return NextResponse.json(
        { success: false, message: 'Senha não configurada para este usuário' },
        { status: 401 }
      )
    }

    // Verificar senha
    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Login bem-sucedido
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperAdmin: user.isSuperAdmin
      }
    })

  } catch (error) {
    console.error('Erro na autenticação do super admin:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

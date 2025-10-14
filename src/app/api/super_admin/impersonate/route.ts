import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { randomBytes } from 'crypto'

/**
 * API para criar token de impersonação
 * Permite que super admin acesse a conta de um usuário sem senha
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, superAdminEmail } = await request.json()

    if (!userId || !superAdminEmail) {
      return NextResponse.json(
        { success: false, message: 'userId e superAdminEmail são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o super admin existe e tem permissão
    const superAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
      select: { id: true, isSuperAdmin: true, email: true, name: true }
    })

    if (!superAdmin || !superAdmin.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas super administradores podem impersonar usuários.' },
        { status: 403 }
      )
    }

    // Verificar se o usuário a ser impersonado existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true,
        isSuperAdmin: true 
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Não permitir impersonar outro super admin
    if (targetUser.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Não é permitido impersonar outro super administrador' },
        { status: 403 }
      )
    }

    // Criar token de impersonação temporário (válido por 5 minutos)
    const impersonationToken = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutos

    await prisma.verificationToken.create({
      data: {
        identifier: `impersonate:${userId}:${superAdmin.id}`,
        token: impersonationToken,
        expires
      }
    })

    // Registrar auditoria da impersonação
    console.log(`[SUPER_ADMIN_AUDIT] ${superAdmin.email} (${superAdmin.id}) está impersonando ${targetUser.email} (${targetUser.id}) em ${new Date().toISOString()}`)

    // Retornar URL de impersonação
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const impersonateUrl = new URL('/api/super_admin/impersonate/login', siteUrl)
    impersonateUrl.searchParams.append('token', impersonationToken)
    impersonateUrl.searchParams.append('userId', userId)

    return NextResponse.json({
      success: true,
      impersonateUrl: impersonateUrl.toString(),
      expiresIn: 300 // segundos
    })

  } catch (error) {
    console.error('Erro ao criar token de impersonação:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


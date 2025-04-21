import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const { email, password, currentPassword } = await req.json()

    // Verificar se está autenticado
    if (!session?.user?.id) {
      console.log('[SET-PASSWORD] Tentativa não autenticada')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    let userEmail = email

    // Se não foi fornecido email, usar o email do usuário autenticado
    if (!userEmail) {
      userEmail = session.user.email as string
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      console.log('[SET-PASSWORD] Usuário não encontrado:', userEmail)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário logado é o mesmo que está sendo modificado
    // Ou se é uma operação admin (pode ser implementado depois)
    if (user.id !== session.user.id) {
      console.log('[SET-PASSWORD] Tentativa de modificar outro usuário')
      return NextResponse.json(
        { error: 'Não autorizado a modificar este usuário' },
        { status: 403 }
      )
    }

    // Se o usuário já tem senha, exigir a senha atual
    if (user.password && !currentPassword) {
      console.log('[SET-PASSWORD] Senha atual não fornecida')
      return NextResponse.json(
        { error: 'A senha atual é necessária' },
        { status: 400 }
      )
    }

    // Verificar senha atual se necessário
    if (user.password && currentPassword) {
      const { compare } = await import('bcrypt')
      const passwordMatch = await compare(currentPassword, user.password)
      if (!passwordMatch) {
        console.log('[SET-PASSWORD] Senha atual incorreta')
        return NextResponse.json(
          { error: 'Senha atual incorreta' },
          { status: 401 }
        )
      }
    }

    // Hash da nova senha
    const hashedPassword = await hash(password, 10)

    // Atualizar a senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    console.log('[SET-PASSWORD] Senha atualizada com sucesso para:', userEmail)
    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso'
    })
  } catch (error) {
    console.error('[SET-PASSWORD] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  }
} 
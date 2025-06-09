import { NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { auth } from '@/services/auth'

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar afiliado
    const affiliate = await prisma.affiliate.findFirst({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Afiliado não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar status para active
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { status: 'active' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao ativar afiliado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
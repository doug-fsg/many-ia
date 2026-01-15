import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params
    const { customCreditLimit } = await request.json()

    await prisma.user.update({
      where: { id: clientId },
      data: { customCreditLimit }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar limite:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

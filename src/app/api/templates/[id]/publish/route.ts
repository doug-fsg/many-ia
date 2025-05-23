import { NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { isPublished } = await req.json()

    const template = await prisma.template.findUnique({
      where: {
        id: params.id,
      },
      select: {
        userId: true,
      },
    })

    if (!template) {
      return new NextResponse('Template não encontrado', { status: 404 })
    }

    if (template.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const updatedTemplate = await prisma.template.update({
      where: {
        id: params.id,
      },
      data: {
        isPublished,
      },
    })

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('[TEMPLATE_PUBLISH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/database'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          {
            sharedWith: {
              some: {
                userId: session.user.id
              }
            }
          },
          { isPublic: true }
        ]
      },
      include: {
        _count: {
          select: {
            sharedWith: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const templatesWithUsage = templates.map((template) => ({
      ...template,
      usageCount: template._count.sharedWith,
      isOwner: template.userId === session.user.id
    }))

    return NextResponse.json(templatesWithUsage)
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para criar templates
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.canCreateTemplates) {
      return NextResponse.json(
        { error: 'Usuário não tem permissão para criar templates' },
        { status: 403 }
      )
    }

    const data = await request.json()

    const template = await prisma.template.create({
      data: {
        ...data,
        userId: session.user.id
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar template' },
      { status: 500 }
    )
  }
} 
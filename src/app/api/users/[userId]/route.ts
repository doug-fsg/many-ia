import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const masterKey = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!masterKey) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Verificar se a MASTER_KEY fornecida corresponde à do .env
  if (masterKey !== process.env.MASTER_KEY) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        aiConfigs: {
          include: {
            attachments: true,
            temasEvitar: true,
          },
        },
        accounts: true,
        inboxes: true,
        interactions: true,
        sessions: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error retrieving user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
    
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
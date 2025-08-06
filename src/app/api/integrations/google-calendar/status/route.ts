import { NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const integration = await prisma.googleCalendarIntegration.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        email: true,
        calendarId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ integration });
  } catch (error) {
    console.error('Erro ao buscar status da integração:', error);
    return NextResponse.json(
      { error: 'Falha ao obter status da integração' },
      { status: 500 }
    );
  }
} 
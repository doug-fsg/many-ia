import { NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/lib/prisma';
import { hasGoogleCalendarAccess } from '@/lib/feature-flags';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar Feature Flag
    const hasAccess = await hasGoogleCalendarAccess(session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso ao Google Calendar não disponível para este usuário' },
        { status: 403 }
      );
    }

    await prisma.googleCalendarIntegration.delete({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao desconectar Google Calendar:', error);
    return NextResponse.json(
      { error: 'Falha ao desconectar integração' },
      { status: 500 }
    );
  }
} 
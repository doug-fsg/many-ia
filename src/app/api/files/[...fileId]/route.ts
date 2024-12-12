import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string[] } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const fileId = params.fileId.join('/');
  const [userId, fileName] = fileId.split('/');

  if (userId !== session.user.id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), 'private', 'uploads', fileName);

  try {
    const file = await fs.readFile(filePath);
    const response = new NextResponse(file);
    response.headers.set('Content-Type', 'application/octet-stream');
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );
    return response;
  } catch {
    return NextResponse.json(
      { error: 'Arquivo não encontrado' },
      { status: 404 },
    );
  }
}

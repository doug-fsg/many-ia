import { prisma } from '@/services/database';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json(
      { error: 'Email não fornecido' },
      { status: 400 }
    );
  }

  const token = randomBytes(32).toString('hex'); // Gera um token aleatório
  const expires = new Date(Date.now() + 15 * 60 * 1000); // Expira em 15 minutos

  // Salvar o token no banco de dados
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  console.log(`Token criado para ${email}: ${token}`);
  return NextResponse.json({ token });
}

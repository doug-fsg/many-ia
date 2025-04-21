import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/database';
import { randomBytes } from 'crypto';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

// Função para gerar um token temporário
async function generateTemporaryToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

// Função para validar o token temporário
async function validateTemporaryToken(token: string, email: string): Promise<boolean> {
  const storedToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!storedToken || 
      storedToken.identifier !== email || 
      storedToken.expires < new Date()) {
    return false;
  }

  await prisma.verificationToken.delete({
    where: { token },
  });

  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const manytalksAccountId = searchParams.get('manytalksAccountId');
  const name = searchParams.get('name');
  const image = searchParams.get('image');

  if (!email) {
    return NextResponse.json({ error: 'Email não fornecido' }, { status: 400 });
  }

  // Etapa 1: Gerar token temporário
  if (!token) {
    const newToken = await generateTemporaryToken(email);
    return NextResponse.json({ token: newToken });
  }

  // Etapa 2: Validar token e criar/atualizar usuário
  const isValidToken = await validateTemporaryToken(token, email);

  if (!isValidToken) {
    return NextResponse.json(
      { error: 'Token inválido ou expirado.' },
      { status: 401 }
    );
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        image,
        emailVerified: new Date(),
        manytalksAccountId,
        isIntegrationUser: true
      },
    });
  } else {
    const updatedData: any = {
      isIntegrationUser: true
    };

    if (name && user.name !== name) {
      updatedData.name = name;
    }
    if (image && user.image !== image) {
      updatedData.image = image;
    }
    if (manytalksAccountId && user.manytalksAccountId !== manytalksAccountId) {
      updatedData.manytalksAccountId = manytalksAccountId;
    }

    await prisma.user.update({
      where: { email },
      data: updatedData,
    });
    
    user = await prisma.user.findUnique({ where: { email } });
  }

  if (!user) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }

  const expiresIn = 60 * 60 * 24 * 7; // 7 dias
  const sessionToken = await new SignJWT({ 
    userId: user.id,
    email: user.email,
    name: user.name,
    isIntegrationUser: user.isIntegrationUser
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${expiresIn}s`)
    .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret'));

  // Remover sessões existentes antes de criar uma nova
  await prisma.session.deleteMany({
    where: {
      userId: user.id,
    },
  });

  // Criar nova sessão no banco
  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + expiresIn * 1000)
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const response = NextResponse.redirect(new URL('/app', siteUrl));

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: expiresIn
  };
  
  const cookieStore = cookies();
  cookieStore.set('authjs.session-token', sessionToken, cookieOptions);
  cookieStore.set('next-auth.session-token', sessionToken, cookieOptions);
  
  if (process.env.NODE_ENV === 'production') {
    cookieStore.set('__Secure-next-auth.session-token', sessionToken, {
      ...cookieOptions,
      secure: true
    });
  }

  return response;
}

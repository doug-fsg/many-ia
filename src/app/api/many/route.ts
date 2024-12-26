import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/database';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

// Função para gerar um token temporário
async function generateTemporaryToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000); // Expira em 15 minutos

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  console.log(`[LOG] Token temporário gerado para ${email}: ${token}`);
  return token;
}

// Função para validar o token temporário
async function validateTemporaryToken(token: string, email: string): Promise<boolean> {
  console.log('[LOG] Validando token temporário:', { token, email });

  const storedToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!storedToken) {
    console.error('[ERRO] Token não encontrado no banco de dados.');
    return false;
  }

  if (storedToken.identifier !== email) {
    console.error('[ERRO] Token não corresponde ao email.');
    return false;
  }

  if (storedToken.expires < new Date()) {
    console.error('[ERRO] Token expirado.');
    return false;
  }

  console.log('[LOG] Token validado com sucesso.');

  await prisma.verificationToken.delete({
    where: { token },
  });

  console.log('[LOG] Token removido após uso.');
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const manytalksAccountId = searchParams.get('manytalksAccountId');
  const name = searchParams.get('name'); // Nome do usuário
  const image = searchParams.get('image'); // Imagem do usuário

  console.log('[LOG] Requisição recebida com parâmetros:', { email, token, manytalksAccountId, name, image });

  if (!email) {
    console.error('[ERRO] Email não fornecido.');
    return NextResponse.json({ error: 'Email não fornecido' }, { status: 400 });
  }

  if (!token) {
    const newToken = await generateTemporaryToken(email);
    return NextResponse.json({ token: newToken });
  }

  const isValidToken = await validateTemporaryToken(token, email);

  if (!isValidToken) {
    return NextResponse.json(
      { error: 'Token inválido ou expirado.' },
      { status: 401 }
    );
  }

  console.log('[LOG] Token validado. Prosseguindo com o login.');

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log('[LOG] Usuário não encontrado. Criando novo usuário...');
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0], // Salva o nome, ou usa o prefixo do email como padrão
        image, // Salva a imagem fornecida
        emailVerified: new Date(),
        manytalksAccountId, // Salva o manytalksAccountId ao criar o usuário
      },
    });
  } else {
    console.log('[LOG] Usuário encontrado. Atualizando dados, se necessário...');
    const updatedData: any = {};

    if (name && user.name !== name) {
      updatedData.name = name;
    }
    if (image && user.image !== image) {
      updatedData.image = image;
    }
    if (manytalksAccountId && user.manytalksAccountId !== manytalksAccountId) {
      updatedData.manytalksAccountId = manytalksAccountId;
    }

    if (Object.keys(updatedData).length > 0) {
      await prisma.user.update({
        where: { email },
        data: updatedData,
      });
      console.log('[LOG] Dados atualizados para o usuário:', updatedData);
    }
  }

  console.log('[LOG] Usuário processado:', user);

  const sessionToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log('[LOG] Token de sessão gerado:', sessionToken);

  // Remover sessões existentes antes de criar uma nova
  await prisma.session.deleteMany({
    where: {
      userId: user.id,
    },
  })
  console.log('[LOG] Sessões antigas removidas para o usuário:', user.email)

  await prisma.session.create({
    data: {
      sessionToken: sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 60 * 60 * 1000), // Expira em 1 hora
    },
  });

  console.log('[LOG] Sessão salva no banco de dados.');

  const response = NextResponse.redirect(new URL('/app', req.nextUrl.origin));
  response.cookies.set('authjs.session-token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  return response
}

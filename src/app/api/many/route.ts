import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/database';
import { randomBytes } from 'crypto';
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

  // Limpar qualquer sessão existente sempre
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('next-auth.session-token');
  
  if (sessionCookie) {
    cookieStore.delete('next-auth.session-token');
    if (process.env.NODE_ENV === 'production') {
      cookieStore.delete('__Secure-next-auth.session-token');
    }
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
  
  // Etapa 3: Criar um token temporário especial para SSO
  const ssoToken = randomBytes(32).toString('hex');
  const ssoExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
  
  // Salvar no banco para verificação posterior
  await prisma.verificationToken.create({
    data: {
      identifier: user.id,
      token: ssoToken,
      expires: ssoExpires
    }
  });
  
  // Em vez de redirecionar diretamente, retornamos uma página HTML com um botão de login
  // Isso evita problemas com o redirecionamento direto para /api/auth/signin
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const loginUrl = new URL('/auth', siteUrl);
  loginUrl.searchParams.append('callbackUrl', '/app');
  loginUrl.searchParams.append('sso-token', ssoToken);
  loginUrl.searchParams.append('user-id', user.id);

  // Retornar HTML com auto-redirecionamento e botão de fallback
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Redirecionando...</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          padding: 0 20px;
          text-align: center;
        }
        .container {
          max-width: 500px;
        }
        .button {
          display: inline-block;
          background-color: #0070f3;
          color: white;
          border: none;
          padding: 10px 20px;
          margin-top: 20px;
          border-radius: 5px;
          text-decoration: none;
          font-weight: 500;
        }
        .hidden {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Preparando Autenticação...</h1>
        <p>Estamos preparando sua autenticação.</p>
        <p id="status-message">Configurando segurança...</p>
        <div id="loader" class="loader">
          <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #0070f3; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
        <div class="button-container">
          <a id="login-button" href="${loginUrl.toString()}" class="button hidden">Continuar para o login</a>
        </div>
      </div>

      <script>
        async function prepareSSORedirect() {
          try {
            // Garantir que temos um token CSRF
            const response = await fetch('/api/csrf');
            const csrfData = await response.json();
            
            if (csrfData.csrfToken) {
              document.getElementById('status-message').textContent = 'Redirecionando...';
              
              // Redirecionar para a página de login
              setTimeout(() => {
                window.location.href = '${loginUrl.toString()}';
              }, 500);
            } else {
              throw new Error('Não foi possível obter o token CSRF');
            }
          } catch (error) {
            console.error('Erro:', error);
            document.getElementById('status-message').textContent = 'Houve um problema na configuração de segurança.';
            document.getElementById('login-button').classList.remove('hidden');
            document.getElementById('loader').classList.add('hidden');
          }
        }

        // Iniciar o processo quando a página carregar
        window.onload = prepareSSORedirect;
      </script>
      
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  );
}

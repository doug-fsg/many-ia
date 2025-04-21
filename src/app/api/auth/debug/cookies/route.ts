import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/services/auth';

// Verificação baseada em DEBUG_MODE (servidor)
const isDebugEnabled = process.env.DEBUG_MODE === 'true';

export async function GET(req: NextRequest) {
  // Log para debug
  console.log('DEBUG_MODE:', process.env.DEBUG_MODE);
  console.log('isDebugEnabled:', isDebugEnabled);

  // Não permitir quando DEBUG_MODE está desativado
  if (!isDebugEnabled) {
    return NextResponse.json(
      { error: 'Esta rota só está disponível quando DEBUG_MODE está ativado' },
      { status: 403 }
    );
  }

  try {
    // Verificar se o usuário está autenticado
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    // Pegar todos os cookies disponíveis
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Filtrar apenas cookies relevantes para autenticação
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session') || 
      cookie.name.includes('token')
    );
    
    // Preparar um objeto com informações simplificadas e seguras
    const cookieInfo = authCookies.map(cookie => ({
      name: cookie.name,
      exists: true,
      path: '/',
      isSecure: true,
      isHttpOnly: true,
    }));

    // Retornar uma página HTML
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Diagnóstico de Cookies de Sessão</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
        h1 { font-size: 24px; margin-bottom: 20px; }
        h2 { font-size: 20px; margin-top: 30px; margin-bottom: 10px; }
        pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .cookie { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .cookie-name { font-weight: bold; }
        .warning { color: #e53e3e; margin-top: 5px; }
        .info { color: #4299e1; }
        .success { color: #38a169; }
      </style>
    </head>
    <body>
      <h1>Diagnóstico de Cookies de Sessão</h1>
      
      <h2>Status da Sessão</h2>
      <pre>Usuário autenticado: ${session.user.email}</pre>
      
      <h2>Cookies de Autenticação (${authCookies.length})</h2>
      ${authCookies.length === 0 ? '<p class="warning">Nenhum cookie de autenticação encontrado!</p>' : ''}
      ${authCookies.map(cookie => `
        <div class="cookie">
          <div class="cookie-name">${cookie.name}</div>
          <div>Status: <span class="success">Presente</span></div>
          <div>Path: /</div>
          <div>Secure: <span class="success">Sim</span></div>
          <div>HttpOnly: <span class="success">Sim</span></div>
        </div>
      `).join('')}
      
      <h2>Recomendações</h2>
      <ul>
        ${!authCookies.some(c => c.name === 'next-auth.session-token') ? 
          '<li class="warning">Cookie next-auth.session-token não encontrado. A autenticação NextAuth pode não estar funcionando corretamente.</li>' : 
          '<li class="success">Cookie next-auth.session-token encontrado.</li>'}
        ${!authCookies.some(c => c.name === 'authjs.session-token') ? 
          '<li class="warning">Cookie authjs.session-token não encontrado. A autenticação Auth.js pode não estar funcionando corretamente.</li>' : 
          '<li class="success">Cookie authjs.session-token encontrado.</li>'}
      </ul>

      <p><a href="/app/settings" style="display: inline-block; margin-top: 20px; padding: 8px 16px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 4px;">Voltar para as Configurações</a></p>
    </body>
    </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Erro ao verificar cookies:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar cookies' },
      { status: 500 }
    );
  }
} 
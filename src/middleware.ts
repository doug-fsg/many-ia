import { NextRequest, NextResponse } from 'next/server'
import { getUrl } from './lib/get-url'

// Nomes possíveis para cookies de sessão
const SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token'
]

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Verificar todos os possíveis cookies de sessão
  let isAuthenticated = false
  let tokenFound = null
  
  // Verificar se qualquer um dos cookies de sessão está presente
  for (const cookieName of SESSION_COOKIE_NAMES) {
    const token = req.cookies.get(cookieName)
    if (token) {
      isAuthenticated = true
      tokenFound = cookieName
      console.log(`[MIDDLEWARE] Token encontrado em cookie: ${cookieName}`)
      break
    }
  }
  
  // Para debug, listar todos os cookies disponíveis
  console.log('[MIDDLEWARE] Cookies disponíveis:', 
    [...req.cookies.getAll()].map(c => c.name).join(', '))
  
  // Redireciona para o app se já estiver logado e tentar acessar auth
  if (pathname === '/auth' && isAuthenticated) {
    console.log('[MIDDLEWARE] Usuário autenticado tentando acessar /auth, redirecionando para /app')
    return NextResponse.redirect(new URL(getUrl('/app')))
  }

  // Redireciona para auth se tentar acessar o app e não estiver logado
  if (pathname.includes('/app') && !isAuthenticated) {
    console.log('[MIDDLEWARE] Usuário não autenticado tentando acessar /app, redirecionando para /auth')
    return NextResponse.redirect(new URL(getUrl('/auth')))
  }
  
  // Se está acessando /app e está autenticado, permitir acesso
  if (pathname.includes('/app') && isAuthenticated) {
    console.log('[MIDDLEWARE] Usuário autenticado acessando /app, permitido')
  }
  
  // Adicionando log de debug para outras rotas
  console.log(`[MIDDLEWARE] Acesso a "${pathname}" - Autenticado: ${isAuthenticated}`)
}

export const config = {
  matcher: ['/auth', '/app/:path*']
}

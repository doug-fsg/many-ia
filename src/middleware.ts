import { NextRequest, NextResponse } from 'next/server'
import { getUrl } from './lib/get-url'

// Nomes possíveis para cookies de sessão
const SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token'
]

// Cookie para controlar o redirecionamento único após login
const REDIRECTED_COOKIE = 'affiliate-redirected'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Processar código de referência para afiliados (para qualquer rota)
  const { searchParams } = new URL(req.url)
  const refCode = searchParams.get('ref')
  let response: NextResponse = NextResponse.next()

  if (refCode) {
    console.log(`[MIDDLEWARE] Código de afiliado detectado: ${refCode}`)
    // Armazenar o código de referência em um cookie que expira em 30 dias
    response = NextResponse.next()
    response.cookies.set('affiliate_ref', refCode, {
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/',
    })
    console.log('[MIDDLEWARE] Cookie de afiliado definido')
  }
  
  // Verificar todos os possíveis cookies de sessão
  let isAuthenticated = false
  
  // Verificar se qualquer um dos cookies de sessão está presente
  for (const cookieName of SESSION_COOKIE_NAMES) {
    const token = req.cookies.get(cookieName)
    if (token) {
      isAuthenticated = true
      break
    }
  }
  
  // Verificar se o usuário está fazendo login (vindo da página de autenticação)
  const referer = req.headers.get('referer') || ''
  const isLoggingIn = referer.includes('/auth') && pathname === '/app'
  
  // Verificar se já redirecionamos o usuário antes
  const wasRedirected = req.cookies.get(REDIRECTED_COOKIE)
  
  // Se o usuário estiver fazendo login e não foi redirecionado antes,
  // vamos redirecionar para uma página especial que vai verificar o status
  if (isLoggingIn && !wasRedirected && isAuthenticated) {
    console.log('[MIDDLEWARE] Novo login detectado, redirecionando para verificação de afiliado')
    
    // Configurar cookie para marcar que já redirecionamos
    const redirectUrl = new URL(getUrl('/app/check-affiliate'), req.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    
    // Configurar cookie para evitar redirecionamentos futuros (expira em 1 dia)
    redirectResponse.cookies.set(REDIRECTED_COOKIE, 'true', {
      maxAge: 60 * 60 * 24, // 1 dia
      path: '/',
    })
    
    return redirectResponse
  }
  
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
  
  return response
}

export const config = {
  matcher: ['/', '/auth', '/auth/:path*', '/app/:path*']
}

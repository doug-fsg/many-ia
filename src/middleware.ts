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
const AFFILIATE_COOKIE = 'affiliate_ref'

export async function middleware(req: NextRequest) {
  // Verificar se estamos em ambiente de build
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'build') {
    return NextResponse.next()
  }

  const pathname = req.nextUrl.pathname
  
  // Processar código de referência para afiliados (para qualquer rota)
  const { searchParams } = new URL(req.url)
  const refCode = searchParams.get('ref')
  
  // Criar uma nova resposta
  const response = NextResponse.next()

  // Verificar se já temos um cookie de afiliado
  const existingAffiliateRef = req.cookies.get(AFFILIATE_COOKIE)
  
  if (refCode) {
    console.log(`[REFERRAL] Código de afiliado detectado na URL: ${refCode}`)
    // Armazenar o código de referência em um cookie que expira em 30 dias
    response.cookies.set(AFFILIATE_COOKIE, refCode, {
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    console.log('[REFERRAL] Cookie de afiliado definido com sucesso')
  } else if (existingAffiliateRef) {
    console.log(`[REFERRAL] Usando cookie de afiliado existente: ${existingAffiliateRef.value}`)
    // Manter o cookie existente na resposta
    response.cookies.set(AFFILIATE_COOKIE, existingAffiliateRef.value, {
      maxAge: 60 * 60 * 24 * 30, // renovar por mais 30 dias
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
  }
  
  // Verificar todos os possíveis cookies de sessão
  let isAuthenticated = false
  let tokenFound = null
  
  try {
    // Verificar se qualquer um dos cookies de sessão está presente
    for (const cookieName of SESSION_COOKIE_NAMES) {
      const token = req.cookies.get(cookieName)
      if (token) {
        isAuthenticated = true
        tokenFound = cookieName
        break
      }
    }
    
    
    // Verificar se o usuário está fazendo login (vindo da página de autenticação)
    const referer = req.headers.get('referer') || ''
    const isLoggingIn = referer.includes('/auth') && pathname === '/app'
    
    // Verificar se já redirecionamos o usuário antes
    const wasRedirected = req.cookies.get(REDIRECTED_COOKIE)
    
    if (isLoggingIn && !wasRedirected && isAuthenticated) {
      console.log('[MIDDLEWARE] Novo login detectado, redirecionando para verificação de afiliado')
      
      const redirectUrl = new URL(getUrl('/app/check-affiliate'), req.url)
      const redirectResponse = NextResponse.redirect(redirectUrl)
      
      // Manter o cookie de afiliado ao redirecionar
      const affiliateRef = req.cookies.get(AFFILIATE_COOKIE)
      if (affiliateRef) {
        redirectResponse.cookies.set(AFFILIATE_COOKIE, affiliateRef.value, {
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
      }
      
      redirectResponse.cookies.set(REDIRECTED_COOKIE, 'true', {
        maxAge: 60 * 60 * 24,
        path: '/',
      })
      
      return redirectResponse
    }
    
    if (pathname === '/auth' && isAuthenticated) {
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

  } catch (error) {
    console.error('[MIDDLEWARE] Erro ao processar autenticação:', error)
  }

  return response
}

export const config = {
  
  matcher: ['/', '/auth', '/app/:path*']
}

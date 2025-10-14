import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'
import { encode } from 'next-auth/jwt'

/**
 * Rota para efetuar login via impersonação
 * Cria uma sessão NextAuth para o usuário impersonado
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const userId = searchParams.get('userId')

    if (!token || !userId) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Erro - Impersonação</title>
            <style>
              body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
              .error { color: #dc2626; font-size: 18px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>❌ Erro</h1>
            <p class="error">Token ou usuário inválido</p>
            <a href="/super_admin/dashboard" class="button">Voltar ao Dashboard</a>
          </body>
        </html>
        `,
        { 
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Verificar se o token é válido
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: { gt: new Date() }
      }
    })

    if (!verificationToken) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Erro - Token Expirado</title>
            <style>
              body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
              .error { color: #dc2626; font-size: 18px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>⏰ Token Expirado</h1>
            <p class="error">O token de impersonação expirou ou é inválido</p>
            <p>Por favor, gere um novo token no dashboard do super admin.</p>
            <a href="/super_admin/dashboard" class="button">Voltar ao Dashboard</a>
          </body>
        </html>
        `,
        { 
          status: 401,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Verificar se o identificador corresponde
    if (!verificationToken.identifier.startsWith(`impersonate:${userId}:`)) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Erro - Token Inválido</title>
            <style>
              body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
              .error { color: #dc2626; font-size: 18px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>❌ Token Inválido</h1>
            <p class="error">O token não corresponde ao usuário solicitado</p>
            <a href="/super_admin/dashboard" class="button">Voltar ao Dashboard</a>
          </body>
        </html>
        `,
        { 
          status: 403,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Erro - Usuário não encontrado</title>
            <style>
              body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
              .error { color: #dc2626; font-size: 18px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>❌ Usuário não encontrado</h1>
            <p class="error">O usuário solicitado não existe no sistema</p>
            <a href="/super_admin/dashboard" class="button">Voltar ao Dashboard</a>
          </body>
        </html>
        `,
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Deletar o token usado (uso único)
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token
        }
      }
    })

    // Extrair super admin ID do identifier
    const superAdminId = verificationToken.identifier.split(':')[2]
    
    // Log de auditoria
    console.log(`[SUPER_ADMIN_AUDIT] Impersonação ativada: Super Admin ${superAdminId} acessou conta de ${user.email} (${user.id}) em ${new Date().toISOString()}`)

    // Criar um JWT válido para o usuário (NextAuth usa JWT, não sessões de banco)
    const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    
    const jwtToken = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.image,
        isIntegrationUser: user.isIntegrationUser,
        sub: user.id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(sessionExpires.getTime() / 1000)
      },
      secret: process.env.NEXTAUTH_SECRET || '',
      salt: process.env.NEXTAUTH_SECRET || 'nextauth-salt'
    })

    // Redirecionar para o app com o cookie JWT
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const response = NextResponse.redirect(new URL('/app', siteUrl))

    // Definir cookie JWT usando o mesmo nome que o NextAuth
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'
    
    response.cookies.set(cookieName, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionExpires,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Erro ao fazer login via impersonação:', error)
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Erro - Servidor</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; font-size: 18px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>⚠️ Erro Interno</h1>
          <p class="error">Ocorreu um erro ao processar a impersonação</p>
          <a href="/super_admin/dashboard" class="button">Voltar ao Dashboard</a>
        </body>
      </html>
      `,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}


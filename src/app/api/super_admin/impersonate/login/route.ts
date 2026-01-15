import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/database'

/**
 * Rota para efetuar login via impersonação
 * Redireciona para a página de autenticação com credenciais especiais
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

    // Extrair super admin ID do identifier
    const superAdminId = verificationToken.identifier.split(':')[2]
    
    // Log de auditoria
    console.log(`[SUPER_ADMIN_AUDIT] Impersonação iniciada: Super Admin ${superAdminId} está acessando conta de ${user.email} (${user.id}) em ${new Date().toISOString()}`)

    // Criar um novo token SSO temporário para autenticação via NextAuth
    // Isso garante que o NextAuth processe corretamente o isIntegrationUser
    const ssoToken = verificationToken.token // Reutilizar o mesmo token
    const ssoExpires = new Date(Date.now() + 2 * 60 * 1000) // 2 minutos para completar o login
    
    // Atualizar o token para o formato SSO
    await prisma.verificationToken.update({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token
        }
      },
      data: {
        identifier: user.id, // Mudar para o formato esperado pelo SSO
        expires: ssoExpires
      }
    })

    // Redirecionar para a página de auth com os parâmetros SSO
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const authUrl = new URL('/auth', siteUrl)
    authUrl.searchParams.append('callbackUrl', '/app')
    authUrl.searchParams.append('sso-token', ssoToken)
    authUrl.searchParams.append('user-id', user.id)

    return NextResponse.redirect(authUrl)

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

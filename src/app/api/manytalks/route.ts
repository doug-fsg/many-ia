import { NextRequest, NextResponse } from 'next/server'

const MANYTALKS_API_BASE_URL = process.env.NEXT_PUBLIC_MANYTALKS_API_URL // URL que você usa no Postman

// Configuração para marcar a rota como dinâmica
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const apiToken = process.env.NEXT_PUBLIC_MANYTALKS_API_TOKEN

    if (!accountId) {
      return NextResponse.json(
        { error: 'AccountId não fornecido' },
        { status: 400 },
      )
    }

    if (!apiToken) {
      console.error(
        '❌ Token da API não configurado no servidor. Token:',
        apiToken,
      )
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 },
      )
    }

    const apiUrl = `${MANYTALKS_API_BASE_URL}/accounts/${accountId}/inboxes`
    console.log('📡 URL completa da requisição:', apiUrl)
    console.log('🔑 Token sendo usado:', apiToken)

    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        api_access_token: apiToken,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Proxy: Erro na resposta da API:', {
        status: response.status,
        errorText,
        url: apiUrl,
        token: apiToken ? 'presente' : 'ausente',
      })
      return NextResponse.json(
        { error: `Erro na API: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log('✅ Proxy: Dados recebidos com sucesso')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Proxy: Erro ao processar requisição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}

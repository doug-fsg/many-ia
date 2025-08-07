import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { auth } from '@/services/auth'

// Função simples para sanitizar nomes de arquivos
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .replace(/[<>:"/\\|?*]/g, '_') // Remove caracteres problemáticos do Windows
    .replace(/__+/g, '_') // Remove underscores múltiplos
    .replace(/^_|_$/g, '') // Remove underscores no início e fim
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const data = await req.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'private', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    
    // Sanitizar o nome do arquivo
    const sanitizedName = sanitizeFileName(file.name)
    const fileName = `${Date.now()}-${sanitizedName}`
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    const fileId = `${session.user.id}/${fileName}`

    return NextResponse.json({ success: true, fileId })
  } catch (error) {
    return NextResponse.json(
      { error: `Algo deu errado! ${(error as Error).message}` },
      { status: 501 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Método GET não suportado para esta rota' },
    { status: 405 },
  )
}

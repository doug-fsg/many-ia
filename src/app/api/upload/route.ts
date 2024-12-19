import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { auth } from '@/services/auth'

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
    const fileName = `${Date.now()}-${file.name}`
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

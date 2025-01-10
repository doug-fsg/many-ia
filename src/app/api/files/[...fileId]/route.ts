import { NextRequest, NextResponse } from 'next/server'
import { getFileData } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string[] } }
) {
  const fileId = params.fileId[params.fileId.length - 1]
  const file = await getFileData(fileId)

  if (!file) {
    return new NextResponse('File not found', { status: 404 })
  }

  const headers = new Headers()
  headers.set('Content-Type', file.contentType)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return new NextResponse(file.data, { headers })
}

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)

    return NextResponse.json({ text: data.text, pages: data.numpages })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'PDF parsing failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Dynamic import avoids pdf-parse reading test files at module load time (crashes on Vercel)
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer, { max: 0 })

    const text = data.text?.trim()
    if (!text || text.length < 20) {
      return NextResponse.json(
        { error: 'Could not extract text from this PDF. It may be image-based or scanned. Try copying the text manually.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text, pages: data.numpages })
  } catch (e) {
    console.error('PDF parse error:', e)
    return NextResponse.json({ error: 'Failed to read PDF. Make sure it is a valid, text-based PDF file.' }, { status: 500 })
  }
}

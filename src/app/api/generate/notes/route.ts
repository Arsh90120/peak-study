import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { nvidiaClient, MODEL } from '@/lib/nvidia'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, title } = await req.json()
  if (!content) return NextResponse.json({ error: 'No content provided' }, { status: 400 })

  const prompt = `You are PEAK AI, an expert study assistant. Given the following study material, generate comprehensive, well-structured notes.

Format your response as JSON with this exact structure:
{
  "title": "string (topic title)",
  "summary": "string (2-3 sentence overview)",
  "sections": [
    {
      "heading": "string",
      "points": ["string", "string", ...],
      "keyTerms": [{"term": "string", "definition": "string"}]
    }
  ],
  "keyTakeaways": ["string", "string", "string"]
}

Study material:
${content.slice(0, 8000)}`

  try {
    const completion = await nvidiaClient.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    })

    const raw = completion.choices[0].message.content || '{}'
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const notes = jsonMatch ? JSON.parse(jsonMatch[0]) : { title, summary: raw, sections: [], keyTakeaways: [] }

    return NextResponse.json({ notes })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
